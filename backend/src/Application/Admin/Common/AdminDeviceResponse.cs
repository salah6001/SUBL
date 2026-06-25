namespace Application.Admin.Common;

public sealed record AdminDeviceResponse(
    Guid Id,
    string DeviceName,
    Guid UserId,
    string? UserEmail,
    string Department,
    string Platform,
    string? OsVersion,
    string? AgentVersion,
    string? LastIpAddress,
    bool IsActive,
    // Liveness: true when an agent reported within the online window. IsActive
    // is only an enabled/registered flag, not a heartbeat.
    bool IsOnline,
    DateTime? LastSeenAt,
    DateTime CreatedAt,
    DateTime? RevokedAt,
    string StressSignal,
    // Data ownership: which user this device's keystroke data is attributed to.
    // A null ClaimedByUserId means unclaimed → data falls back to the registrant.
    Guid? ClaimedByUserId,
    string? ClaimedByEmail);
