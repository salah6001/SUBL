using SharedKernel;

namespace Domain.Privacy;

/// <summary>
/// Per-user privacy and data-collection preferences (1:1 with a user).
/// </summary>
public sealed class UserPrivacySettings : Entity
{
    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    /// <summary>
    /// Monitor typing patterns (core feature). Defaults to on.
    /// </summary>
    public bool KeystrokeDynamics { get; private set; }

    /// <summary>
    /// Analyze communication tone (opt-in).
    /// </summary>
    public bool SentimentAnalysis { get; private set; }

    /// <summary>
    /// Share anonymized product usage analytics.
    /// </summary>
    public bool ProductAnalytics { get; private set; }

    /// <summary>
    /// Share anonymized aggregate reports with the employer.
    /// </summary>
    public bool EmployerDataSharing { get; private set; }

    public DateTime UpdatedAt { get; private set; }

    private UserPrivacySettings()
    {
    }

    public static UserPrivacySettings CreateDefault(Guid userId)
    {
        return new UserPrivacySettings
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            KeystrokeDynamics = true,
            SentimentAnalysis = false,
            ProductAnalytics = false,
            EmployerDataSharing = false,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        bool keystrokeDynamics,
        bool sentimentAnalysis,
        bool productAnalytics,
        bool employerDataSharing)
    {
        KeystrokeDynamics = keystrokeDynamics;
        SentimentAnalysis = sentimentAnalysis;
        ProductAnalytics = productAnalytics;
        EmployerDataSharing = employerDataSharing;
        UpdatedAt = DateTime.UtcNow;
    }
}
