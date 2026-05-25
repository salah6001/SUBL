using Application.Abstractions.Messaging;

namespace Application.StressDetection.Devices.RevokeDevice;

/// <summary>
/// Command to revoke a registered device. The device can no longer start sessions
/// or submit data until it is reactivated by re-registering with the same fingerprint.
/// </summary>
public sealed record RevokeDeviceCommand(Guid DeviceId) : ICommand;
