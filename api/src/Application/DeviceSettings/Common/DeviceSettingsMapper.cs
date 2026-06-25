using Domain.DeviceSettings;

namespace Application.DeviceSettings.Common;

internal static class DeviceSettingsMapper
{
    public static DeviceSettingsResponse ToResponse(UserDeviceSettings settings) =>
        new(
            settings.Language,
            settings.Timezone,
            settings.DateFormat,
            settings.StressThreshold,
            settings.MonitoringInterval.ToString(),
            (int)settings.MonitoringInterval);
}
