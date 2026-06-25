namespace Application.Admin.Common;

/// <summary>
/// Response DTO for an admin stress alert.
/// </summary>
public sealed record AlertResponse(
    Guid Id,
    Guid UserId,
    string Department,
    string Category,
    string Severity,
    string Status,
    string Title,
    string? Message,
    DateTime CreatedAt,
    DateTime? AcknowledgedAt,
    DateTime? ResolvedAt);
