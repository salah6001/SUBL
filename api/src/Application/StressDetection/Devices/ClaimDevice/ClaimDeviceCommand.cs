using Application.Abstractions.Messaging;

namespace Application.StressDetection.Devices.ClaimDevice;

/// <summary>
/// Command for the current user to claim a device's data stream, so the running
/// desktop agent's keystroke readings are attributed to this user's dashboard
/// without changing the agent's deployed credentials.
/// </summary>
public sealed record ClaimDeviceCommand(Guid DeviceId) : ICommand;
