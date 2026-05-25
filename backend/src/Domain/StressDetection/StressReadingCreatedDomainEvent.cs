using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain event raised whenever the ML model produces a new stress reading.
/// </summary>
public sealed record StressReadingCreatedDomainEvent(
    Guid ReadingId,
    Guid SessionId,
    Guid UserId,
    StressLevel Level,
    double Score) : IDomainEvent;
