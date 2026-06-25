using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain event raised when a device is revoked.
/// </summary>
public sealed record DeviceRevokedDomainEvent(
    Guid DeviceId,
    Guid UserId) : IDomainEvent;
