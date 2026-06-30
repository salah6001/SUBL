using System.Net;
using Application.Abstractions.Data;
using Application.Abstractions.Email;
using Application.Abstractions.Messaging;
using Domain.WorkspaceRequests;
using Microsoft.Extensions.Logging;
using SharedKernel;

namespace Application.WorkspaceRequests.CreateWorkspaceRequest;

internal sealed class CreateWorkspaceRequestCommandHandler(
    IApplicationDbContext context,
    IEmailService emailService,
    ILogger<CreateWorkspaceRequestCommandHandler> logger)
    : ICommandHandler<CreateWorkspaceRequestCommand, Guid>
{
    // Where public workspace requests are delivered. The request is also kept
    // in the database; this email is the human-facing notification.
    private const string RequestRecipient = "abdulrahman.wael@proton.me";

    public async Task<Result<Guid>> Handle(
        CreateWorkspaceRequestCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName) ||
            string.IsNullOrWhiteSpace(request.ContactName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            !request.Email.Contains('@', StringComparison.Ordinal))
        {
            return Result.Failure<Guid>(Error.Validation(
                "WorkspaceRequest.Invalid",
                "Company, contact name and a valid work email are required."));
        }

        var workspaceRequest = WorkspaceRequest.Create(
            request.CompanyName,
            request.ContactName,
            request.Email,
            request.Message);

        context.WorkspaceRequests.Add(workspaceRequest);

        await context.SaveChangesAsync(cancellationToken);

        // Notify by email, but never fail the request if mail delivery fails —
        // the request is already persisted.
        try
        {
            await emailService.SendEmailAsync(
                RequestRecipient,
                $"New Subl workspace request — {request.CompanyName}",
                BuildEmailBody(request),
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to email workspace request {RequestId} to {Recipient}",
                workspaceRequest.Id,
                RequestRecipient);
        }

        return Result.Success(workspaceRequest.Id);
    }

    private static string BuildEmailBody(CreateWorkspaceRequestCommand request)
    {
        string company = WebUtility.HtmlEncode(request.CompanyName);
        string contact = WebUtility.HtmlEncode(request.ContactName);
        string email = WebUtility.HtmlEncode(request.Email);
        string message = WebUtility.HtmlEncode(
            string.IsNullOrWhiteSpace(request.Message) ? "—" : request.Message);

        return $"""
            <h2>New workspace request</h2>
            <p><strong>Company:</strong> {company}</p>
            <p><strong>Contact:</strong> {contact}</p>
            <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
            <p><strong>Message:</strong><br/>{message}</p>
            """;
    }
}
