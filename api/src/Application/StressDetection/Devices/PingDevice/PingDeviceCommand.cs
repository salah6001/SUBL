using Application.Abstractions.Messaging;

namespace Application.StressDetection.Devices.PingDevice;

/// <summary>
/// Heartbeat from the desktop agent. Refreshes the device's <c>LastSeenAt</c>
/// even when no keystrokes were captured, so liveness (online/offline) reflects
/// a running agent rather than only session activity.
/// </summary>
public sealed record PingDeviceCommand(Guid DeviceId, string? IpAddress) : ICommand;
