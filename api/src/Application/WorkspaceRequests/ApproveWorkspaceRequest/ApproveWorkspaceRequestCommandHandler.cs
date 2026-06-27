using System.Security.Cryptography;
using Application.Abstractions.Data;
using Application.Abstractions.Email;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Common;
using Domain.Permissions;
using Domain.Users;
using Domain.WorkspaceRequests;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.WorkspaceRequests.ApproveWorkspaceRequest;

/// <summary>
/// Approves a workspace request: provisions an administrator account for the
/// contact, assigns the Administrator role, and emails them a temporary
/// password to sign in with (which they should change on first login).
/// </summary>
internal sealed class ApproveWorkspaceRequestCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IIdentityService identityService,
    IEmailService emailService)
    : ICommandHandler<ApproveWorkspaceRequestCommand, ApproveWorkspaceRequestResponse>
{
    private const string AdministratorRoleName = "Administrator";

    public async Task<Result<ApproveWorkspaceRequestResponse>> Handle(
        ApproveWorkspaceRequestCommand request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<ApproveWorkspaceRequestResponse>(WorkspaceRequestErrors.Forbidden);
        }

        WorkspaceRequest? workspaceRequest = await context.WorkspaceRequests
            .FirstOrDefaultAsync(w => w.Id == request.RequestId, cancellationToken);

        if (workspaceRequest is null)
        {
            return Result.Failure<ApproveWorkspaceRequestResponse>(
                WorkspaceRequestErrors.NotFound(request.RequestId));
        }

        if (workspaceRequest.Status != WorkspaceRequestStatus.Pending)
        {
            return Result.Failure<ApproveWorkspaceRequestResponse>(WorkspaceRequestErrors.NotPending);
        }

        if (await context.Users.AnyAsync(u => u.Email == workspaceRequest.Email, cancellationToken))
        {
            return Result.Failure<ApproveWorkspaceRequestResponse>(
                WorkspaceRequestErrors.EmailAlreadyExists);
        }

        Role? adminRole = await context.Roles
            .FirstOrDefaultAsync(r => r.Name == AdministratorRoleName && r.IsActive, cancellationToken);

        if (adminRole is null)
        {
            return Result.Failure<ApproveWorkspaceRequestResponse>(Error.Problem(
                "WorkspaceRequest.AdminRoleMissing",
                "The Administrator role is not configured."));
        }

        (string firstName, string lastName) = SplitName(workspaceRequest.ContactName);
        string temporaryPassword = GenerateTemporaryPassword();

        // 1. Create the domain user (password lives in Identity, not Domain).
        var user = User.Create(
            workspaceRequest.Email,
            firstName,
            lastName,
            string.Empty,
            AccountType.Staff);

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);

        // 2. Create the linked Identity user with the temporary password.
        Result<Guid> identityResult = await identityService.CreateUserAsync(
            user.Id,
            workspaceRequest.Email,
            temporaryPassword,
            cancellationToken);

        if (identityResult.IsFailure)
        {
            context.Users.Remove(user);
            await context.SaveChangesAsync(cancellationToken);
            return Result.Failure<ApproveWorkspaceRequestResponse>(identityResult.Error);
        }

        // 3. Grant the Administrator role and create a profile.
        context.UserRoles.Add(UserRole.Create(user.Id, adminRole.Id, currentUserService.UserId));
        context.UserProfiles.Add(UserProfile.Create(user.Id, Department.Unassigned));

        // 4. Mark the request approved.
        workspaceRequest.Approve(user.Id);

        await context.SaveChangesAsync(cancellationToken);

        // 5. Email the new admin their sign-in details (best-effort).
        await SendWelcomeEmailAsync(workspaceRequest, temporaryPassword, cancellationToken);

        return Result.Success(new ApproveWorkspaceRequestResponse(
            user.Id,
            workspaceRequest.Email,
            temporaryPassword));
    }

    private async Task SendWelcomeEmailAsync(
        WorkspaceRequest workspaceRequest,
        string temporaryPassword,
        CancellationToken cancellationToken)
    {
        try
        {
            string body =
                $"<p>Hi {System.Net.WebUtility.HtmlEncode(workspaceRequest.ContactName)},</p>" +
                $"<p>Your Subl workspace for <strong>{System.Net.WebUtility.HtmlEncode(workspaceRequest.CompanyName)}</strong> is ready.</p>" +
                "<p>You can sign in to the admin dashboard with these credentials:</p>" +
                $"<ul><li><strong>Email:</strong> {System.Net.WebUtility.HtmlEncode(workspaceRequest.Email)}</li>" +
                $"<li><strong>Temporary password:</strong> {System.Net.WebUtility.HtmlEncode(temporaryPassword)}</li></ul>" +
                "<p>For your security, please change this password right after your first sign-in.</p>" +
                "<p>— The Subl team</p>";

            await emailService.SendEmailAsync(
                workspaceRequest.Email,
                "Your Subl workspace is ready",
                body,
                cancellationToken);
        }
        catch
        {
            // Email is best-effort: the temporary password is also returned to the
            // approving admin, so a mail outage never blocks onboarding.
        }
    }

    private static (string FirstName, string LastName) SplitName(string contactName)
    {
        string[] parts = contactName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0)
        {
            return ("New", "Admin");
        }

        string first = parts[0];
        string last = parts.Length > 1 ? string.Join(' ', parts[1..]) : "Admin";
        return (first, last);
    }

    private static string GenerateTemporaryPassword()
    {
        // Prefix guarantees the four character classes Identity requires; the
        // random suffix provides entropy.
        string random = Convert.ToBase64String(RandomNumberGenerator.GetBytes(9))
            .Replace("+", "x", StringComparison.Ordinal)
            .Replace("/", "y", StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);

        return $"Aa1!{random}";
    }
}
