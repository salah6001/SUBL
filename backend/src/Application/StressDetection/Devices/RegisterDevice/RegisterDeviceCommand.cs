using Application.Abstractions.Messaging;

namespace Application.StressDetection.Devices.RegisterDevice;

/// <summary>
/// Command to register (or re-register) a desktop agent device for the current user.
/// Re-registering by the same fingerprint is idempotent: the existing device is reactivated
/// and returned so agents can recover from local-data loss without piling up rows.
/// </summary>
public sealed record RegisterDeviceCommand(
    string DeviceName,
    string DeviceFingerprint,
    string Platform,
    string? OsVersion,
    string? AgentVersion,
    string? IpAddress) : ICommand<Guid>;
