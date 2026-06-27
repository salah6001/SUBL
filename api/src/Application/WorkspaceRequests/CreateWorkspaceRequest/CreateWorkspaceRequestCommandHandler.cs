using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.WorkspaceRequests;
using SharedKernel;

namespace Application.WorkspaceRequests.CreateWorkspaceRequest;

internal sealed class CreateWorkspaceRequestCommandHandler(
    IApplicationDbContext context)
    : ICommandHandler<CreateWorkspaceRequestCommand, Guid>
{
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

        return Result.Success(workspaceRequest.Id);
    }
}
