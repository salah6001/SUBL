namespace Application.WorkspaceRequests.Common;

/// <summary>
/// Admin-facing view of a workspace (new-admin) request.
/// </summary>
public sealed record WorkspaceRequestResponse(
    Guid Id,
    string CompanyName,
    string ContactName,
    string Email,
    string? Message,
    string Status,
    DateTime CreatedAt,
    DateTime? ReviewedAt,
    string? ReviewNote);
