namespace Application.StressDetection.Devices.AutoClaimDevice;

/// <summary>
/// Result of an auto-claim attempt.
/// </summary>
/// <param name="DeviceId">The device now feeding the user, if any.</param>
/// <param name="DeviceName">Friendly name of that device, if any.</param>
/// <param name="Claimed">True when this call newly claimed a device (vs. one already feeding the user, or none available).</param>
public sealed record AutoClaimDeviceResponse(
    Guid? DeviceId,
    string? DeviceName,
    bool Claimed);
