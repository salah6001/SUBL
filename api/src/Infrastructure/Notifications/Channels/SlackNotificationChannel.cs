using System.Net.Http.Json;
using Application.Abstractions.Notifications;
using Domain.Notifications;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Notifications.Channels;

/// <summary>
/// Posts notifications to a Slack channel via an incoming webhook. A single
/// team webhook is used for all Slack-routed notifications.
/// </summary>
internal sealed class SlackNotificationChannel : INotificationChannel
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly SlackSettings _settings;
    private readonly ILogger<SlackNotificationChannel> _logger;

    public SlackNotificationChannel(
        IHttpClientFactory httpClientFactory,
        IOptions<SlackSettings> settings,
        ILogger<SlackNotificationChannel> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _logger = logger;
    }

    public NotificationChannel Channel => NotificationChannel.Slack;

    public bool IsAvailable => _settings.IsConfigured;

    public async Task<bool> DeliverAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        // Slack "mrkdwn": *bold* title then the message body.
        string text = $"*{notification.Title}*\n{notification.Message}";

        var payload = new { text };

        try
        {
            using HttpClient client = _httpClientFactory.CreateClient();
            using HttpResponseMessage response = await client.PostAsJsonAsync(_settings.WebhookUrl, payload, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Slack delivery failed ({Status}) for user {UserId}",
                    response.StatusCode, notification.UserId);
                return false;
            }

            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Slack delivery failed for user {UserId}", notification.UserId);
            return false;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "Slack delivery timed out for user {UserId}", notification.UserId);
            return false;
        }
    }
}
