using Application.Abstractions.Messaging;

namespace Application.StressDetection.Devices.AutoClaimDevice;

/// <summary>
/// Command run on login: if a monitoring agent is currently online and not
/// owned by another user, automatically claim it for the current user so their
/// dashboard starts receiving data without any manual step.
/// </summary>
public sealed record AutoClaimDeviceCommand : ICommand<AutoClaimDeviceResponse>;
