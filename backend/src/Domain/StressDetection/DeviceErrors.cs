using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain errors for Device operations.
/// </summary>
public static class DeviceErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "Device.NotFound",
        $"The device with Id = '{id}' was not found");

    public static Error NotOwnedByUser => Error.Forbidden(
        "Device.NotOwnedByUser",
        "You do not have access to this device");

    public static Error AlreadyRegistered(string fingerprint) => Error.Conflict(
        "Device.AlreadyRegistered",
        $"A device with fingerprint '{fingerprint}' is already registered for this user");

    public static Error Revoked => Error.Failure(
        "Device.Revoked",
        "This device has been revoked and cannot be used");

    public static Error InvalidPlatform(string platform) => Error.Validation(
        "Device.InvalidPlatform",
        $"The platform '{platform}' is not supported");
}
