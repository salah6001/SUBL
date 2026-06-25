namespace Application.Privacy.Common;

/// <summary>
/// Response DTO for a user's privacy settings.
/// </summary>
public sealed record PrivacySettingsResponse(
    bool KeystrokeDynamics,
    bool SentimentAnalysis,
    bool ProductAnalytics,
    bool EmployerDataSharing);
