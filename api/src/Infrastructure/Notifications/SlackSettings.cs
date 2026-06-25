namespace Infrastructure.Notifications;

/// <summary>
/// Slack incoming-webhook configuration. A single team webhook receives all
/// Slack-routed notifications (there is no per-user Slack routing).
/// </summary>
public sealed class SlackSettings
{
    public const string SectionName = "Slack";

    /// <summary>
    /// Slack incoming webhook URL (https://hooks.slack.com/services/...).
    /// </summary>
    public string WebhookUrl { get; init; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(WebhookUrl);
}
