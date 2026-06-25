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
    string? LastIpAddress,
    DateTime CreatedAt,
    DateTime? RevokedAt);

/// <summary>
/// Response DTO for a device a user may claim (point at their own dashboard).
/// </summary>
public sealed record ClaimableDeviceResponse(
    Guid Id,
    string DeviceName,
    string Platform,
    DateTime? LastSeenAt,
    bool IsActive,
    /// <summary>True when the agent reported within the online window (an agent is actually running).</summary>
    bool IsOnline,
    /// <summary>True when this device currently feeds the current user's dashboard.</summary>
    bool ClaimedByMe,
    /// <summary>True when another user has claimed this device.</summary>
    bool ClaimedByOther);
