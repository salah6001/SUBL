using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain event raised when a stress monitoring session is ended (completed or abandoned).
/// </summary>
public sealed record SessionEndedDomainEvent(
    Guid SessionId,
    Guid UserId,
    double AverageStressScore,
    double PeakStressScore) : IDomainEvent;
