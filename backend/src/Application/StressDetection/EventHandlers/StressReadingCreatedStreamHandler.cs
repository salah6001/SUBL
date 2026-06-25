using Application.Abstractions.RealTime;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.EventHandlers;

/// <summary>
/// Fans out each new stress reading to the user's connected WebSocket clients.
/// Stress data only — no emotion in the stream (emotion is served via REST /stress/summary).
/// </summary>
internal sealed class StressReadingCreatedStreamHandler(IStressStreamHub hub)
    : IDomainEventHandler<StressReadingCreatedDomainEvent>
{
    public async Task Handle(StressReadingCreatedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        var message = new StressStreamMessage(
            Score: Math.Round(domainEvent.Score * 100, 1),
            Level: domainEvent.Level.ToString(),
            Confidence: Math.Round(domainEvent.Confidence, 3),
            At: DateTime.UtcNow);

        await hub.BroadcastAsync(domainEvent.UserId, message, cancellationToken);
    }
}
