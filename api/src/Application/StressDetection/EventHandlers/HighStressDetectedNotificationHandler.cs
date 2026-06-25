using Application.Abstractions.Notifications;
using Application.Notifications.Common;
using Domain.Notifications;
using Domain.StressDetection;

namespace Application.StressDetection.EventHandlers;

/// <summary>
/// Sends a high-stress alert notification to the user when the ML model
/// flags a reading as High or Critical.
/// </summary>
internal sealed class HighStressDetectedNotificationHandler(
    INotificationService notificationService)
    : NotificationDomainEventHandler<HighStressDetectedDomainEvent>(notificationService)
{
    /// <summary>
    /// Notification type seeded by the database. Falls back gracefully if missing.
    /// </summary>
    protected override string NotificationTypeCode => "stress.high_detected";

    protected override Task<NotificationContext?> BuildContextAsync(
        HighStressDetectedDomainEvent domainEvent,
        CancellationToken cancellationToken)
    {
        var context = new NotificationContext
        {
            RecipientUserIds = [domainEvent.UserId],
            EntityType = "StressReading",
            EntityId = domainEvent.ReadingId,
            Priority = domainEvent.Level == StressLevel.Critical
                ? NotificationPriority.Urgent
                : NotificationPriority.High,
            // Coalesce repeated high-stress alerts within the same session into one badge.
            GroupKey = $"stress-alert-{domainEvent.SessionId}",
            Data =
            {
                ["level"] = domainEvent.Level.ToString(),
                ["score"] = Math.Round(domainEvent.Score, 2),
                ["sessionId"] = domainEvent.SessionId
            }
        };

        return Task.FromResult<NotificationContext?>(context);
    }
}
