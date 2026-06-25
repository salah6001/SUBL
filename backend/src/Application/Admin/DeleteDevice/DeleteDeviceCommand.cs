using Application.Abstractions.Messaging;

namespace Application.Admin.DeleteDevice;

/// <summary>
/// Permanently removes a device row from the database (super admin only).
/// Only allowed for devices that are already revoked/inactive.
/// </summary>
public sealed record DeleteDeviceCommand(Guid DeviceId) : ICommand;
