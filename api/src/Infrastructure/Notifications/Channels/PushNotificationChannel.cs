using System.Text.Json;
using Application.Abstractions.Notifications;
using Domain.Notifications;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WebPush;

namespace Infrastructure.Notifications.Channels;

/// <summary>
/// Browser Web Push channel (VAPID). Delivers to every active Web push
/// subscription the user has registered.
/// </summary>
internal sealed class PushNotificationChannel : INotificationChannel
{
    private readonly ApplicationDbContext _context;
    private readonly WebPushSettings _settings;
    private readonly ILogger<PushNotificationChannel> _logger;

    public PushNotificationChannel(
        ApplicationDbContext context,
        IOptions<WebPushSettings> settings,
        ILogger<PushNotificationChannel> logger)
    {
        _context = context;
        _settings = settings.Value;
        _logger = logger;
    }

    public NotificationChannel Channel => NotificationChannel.Push;

    public bool IsAvailable => _settings.IsConfigured;

    public async Task<bool> DeliverAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        List<UserPushToken> tokens = await _context.UserPushTokens
            .Where(t => t.UserId == notification.UserId
                && t.IsActive
                && t.Platform == PushPlatform.Web)
            .ToListAsync(cancellationToken);

        if (tokens.Count == 0)
        {
            return false;
        }

        var vapid = new VapidDetails(_settings.Subject, _settings.PublicKey, _settings.PrivateKey);

        string payload = JsonSerializer.Serialize(new
        {
            title = notification.Title,
            body = notification.Message,
            url = notification.ActionUrl ?? "/",
            icon = "/icon-192.png",
        });

        bool anyDelivered = false;
        using var client = new WebPushClient();

        foreach (UserPushToken token in tokens)
        {
            PushSubscription? subscription = ParseSubscription(token.Token);
            if (subscription is null)
            {
                continue;
            }

            try
            {
                await client.SendNotificationAsync(subscription, payload, vapid, cancellationToken);
                token.UpdateLastUsed();
                anyDelivered = true;
            }
            catch (WebPushException ex)
            {
                // 404/410 mean the subscription is permanently gone — disable it
                // so we stop trying. Other errors are transient.
                if (ex.StatusCode is System.Net.HttpStatusCode.NotFound
                    or System.Net.HttpStatusCode.Gone)
                {
                    token.Deactivate();
                    _logger.LogInformation(ex,
                        "Deactivated expired web-push subscription for user {UserId}",
                        notification.UserId);
                }
                else
                {
                    _logger.LogWarning(ex,
                        "Web push delivery failed ({Status}) for user {UserId}",
                        ex.StatusCode, notification.UserId);
                }
            }
            catch (ArgumentException ex)
            {
                // A stored subscription with malformed keys can never succeed —
                // deactivate it so it stops erroring on every notification.
                token.Deactivate();
                _logger.LogWarning(ex,
                    "Deactivated web-push subscription with invalid keys for user {UserId}",
                    notification.UserId);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return anyDelivered;
    }

    private PushSubscription? ParseSubscription(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;
            string? endpoint = root.GetProperty("endpoint").GetString();
            JsonElement keys = root.GetProperty("keys");
            string? p256dh = keys.GetProperty("p256dh").GetString();
            string? auth = keys.GetProperty("auth").GetString();

            if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(p256dh) || string.IsNullOrEmpty(auth))
            {
                return null;
            }

            return new PushSubscription(endpoint, p256dh, auth);
        }
        catch (Exception ex) when (ex is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            _logger.LogWarning(ex, "Skipping malformed web-push subscription");
            return null;
        }
    }
}
