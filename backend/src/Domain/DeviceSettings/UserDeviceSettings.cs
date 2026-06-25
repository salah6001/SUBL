using SharedKernel;

namespace Domain.DeviceSettings;

/// <summary>
/// Per-user device/app preferences (1:1 with a user).
/// </summary>
public sealed class UserDeviceSettings : Entity
{
    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    /// <summary>
    /// UI language tag, e.g. "en-US".
    /// </summary>
    public string Language { get; private set; } = "en-US";

    /// <summary>
    /// IANA/Windows timezone, e.g. "UTC" or "America/New_York".
    /// </summary>
    public string Timezone { get; private set; } = "UTC";

    /// <summary>
    /// Preferred date format, e.g. "MM/DD/YYYY".
    /// </summary>
    public string DateFormat { get; private set; } = "MM/DD/YYYY";

    /// <summary>
    /// UI theme preference: "light", "dark", or "system".
    /// </summary>
    public string Theme { get; private set; } = "system";

    /// <summary>
    /// Stress alert threshold (0-100).
    /// </summary>
    public int StressThreshold { get; private set; }

    public MonitoringInterval MonitoringInterval { get; private set; }

    public DateTime UpdatedAt { get; private set; }

    private UserDeviceSettings()
    {
    }

    public static UserDeviceSettings CreateDefault(Guid userId)
    {
        return new UserDeviceSettings
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Language = "en-US",
            Timezone = "UTC",
            DateFormat = "MM/DD/YYYY",
            Theme = "system",
            StressThreshold = 70,
            MonitoringInterval = MonitoringInterval.ThirtyMinutes,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string language,
        string timezone,
        string dateFormat,
        int stressThreshold,
        MonitoringInterval monitoringInterval)
    {
        Language = language;
        Timezone = timezone;
        DateFormat = dateFormat;
        StressThreshold = stressThreshold;
        MonitoringInterval = monitoringInterval;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates the user-facing UI preferences (theme, language, timezone, date
    /// format). Used by the settings screen.
    /// </summary>
    public void UpdatePreferences(string theme, string language, string timezone, string dateFormat)
    {
        Theme = theme;
        Language = language;
        Timezone = timezone;
        DateFormat = dateFormat;
        UpdatedAt = DateTime.UtcNow;
    }
}
