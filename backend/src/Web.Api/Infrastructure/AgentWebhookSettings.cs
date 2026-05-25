namespace Web.Api.Infrastructure;

/// <summary>
/// Configuration for validating desktop agent webhook requests.
/// </summary>
public sealed class AgentWebhookSettings
{
    public const string SectionName = "AgentWebhook";

    /// <summary>
    /// Shared secret used to compute the HMAC signature.
    /// </summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>
    /// Allowed clock skew window (seconds) between agent and server.
    /// </summary>
    public int MaxSkewSeconds { get; set; } = 600;

    /// <summary>
    /// Header name that carries the HMAC signature.
    /// </summary>
    public string SignatureHeader { get; set; } = "X-Webhook-Signature";

    /// <summary>
    /// Header name that carries the Unix timestamp (seconds).
    /// </summary>
    public string TimestampHeader { get; set; } = "X-Webhook-Timestamp";
}
