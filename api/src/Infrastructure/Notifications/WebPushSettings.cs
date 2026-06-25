namespace Infrastructure.Notifications;

/// <summary>
/// VAPID configuration for browser Web Push.
/// </summary>
public sealed class WebPushSettings
{
    public const string SectionName = "WebPush";

    /// <summary>
    /// VAPID subject — a mailto: or https: URL identifying the sender.
    /// </summary>
    public string Subject { get; init; } = "mailto:admin@subl.local";

    /// <summary>
    /// Base64url-encoded VAPID public key (shared with the browser).
    /// </summary>
    public string PublicKey { get; init; } = string.Empty;

    /// <summary>
    /// Base64url-encoded VAPID private key (server-only).
    /// </summary>
    public string PrivateKey { get; init; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(PrivateKey);
}
