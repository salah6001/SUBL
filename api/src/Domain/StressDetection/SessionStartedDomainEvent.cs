using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain event raised when a stress monitoring session is started.
/// </summary>
public sealed record SessionStartedDomainEvent(
    Guid SessionId,
    Guid UserId,
    Guid DeviceId) : IDomainEvent;
