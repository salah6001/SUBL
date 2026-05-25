namespace Application.StressDetection.Common;

/// <summary>
/// Response DTO for a registered desktop agent device.
/// </summary>
public sealed record DeviceResponse(
    Guid Id,
    string DeviceName,
    string Platform,
    string? OsVersion,
    string? AgentVersion,
    bool IsActive,
    DateTime? LastSeenAt,
    DateTime CreatedAt,
    DateTime? RevokedAt);
