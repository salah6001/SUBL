using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain event raised when a new desktop agent device is registered.
/// </summary>
public sealed record DeviceRegisteredDomainEvent(
    Guid DeviceId,
    Guid UserId) : IDomainEvent;
