using Application.Abstractions.Messaging;

namespace Application.Notifications.ResolveNotification;

/// <summary>
/// Command to resolve a notification (e.g. mark a stress alert as acted upon).
/// </summary>
public sealed record ResolveNotificationCommand(Guid NotificationId) : ICommand;
