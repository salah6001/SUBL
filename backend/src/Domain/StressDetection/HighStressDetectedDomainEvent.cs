using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain event raised when the stress level of a new reading is High or Critical.
/// Notification handlers listen to this event to push alerts to the user
/// (in-app, email, push - depending on the user's preferences).
/// </summary>
public sealed record HighStressDetectedDomainEvent(
    Guid ReadingId,
    Guid SessionId,
    Guid UserId,
    StressLevel Level,
    double Score) : IDomainEvent;
