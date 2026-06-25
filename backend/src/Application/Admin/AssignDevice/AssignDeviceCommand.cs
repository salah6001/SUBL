using Application.Abstractions.Messaging;

namespace Application.Admin.AssignDevice;

/// <summary>
/// Admin command to set which user a device's keystroke data is attributed to.
/// A null <see cref="UserId"/> releases the claim so data falls back to the
/// registrant (the agent's own account).
/// </summary>
public sealed record AssignDeviceCommand(Guid DeviceId, Guid? UserId) : ICommand;
