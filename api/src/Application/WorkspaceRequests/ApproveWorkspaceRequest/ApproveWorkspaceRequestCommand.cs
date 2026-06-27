using Application.Abstractions.Messaging;

namespace Application.WorkspaceRequests.ApproveWorkspaceRequest;

public sealed record ApproveWorkspaceRequestCommand(Guid RequestId)
    : ICommand<ApproveWorkspaceRequestResponse>;

/// <summary>
/// Result of approving a request. The temporary password is also returned so an
/// admin can relay it manually if email delivery is unavailable.
/// </summary>
public sealed record ApproveWorkspaceRequestResponse(
    Guid UserId,
    string Email,
    string TemporaryPassword);
