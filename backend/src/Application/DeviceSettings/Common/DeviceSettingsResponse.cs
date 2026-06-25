namespace Application.DeviceSettings.Common;

/// <summary>
/// Response DTO for a user's device/app settings.
/// </summary>
public sealed record DeviceSettingsResponse(
    string Language,
    string Timezone,
    string DateFormat,
    int StressThreshold,
    string MonitoringInterval,
    int MonitoringIntervalMinutes);
