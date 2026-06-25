using Application.Abstractions.Messaging;
using Application.DeviceSettings.Common;
using Domain.DeviceSettings;

namespace Application.DeviceSettings.UpdateDeviceSettings;

public sealed record UpdateDeviceSettingsCommand(
    string Language,
    string Timezone,
    string DateFormat,
    int StressThreshold,
    MonitoringInterval MonitoringInterval) : ICommand<DeviceSettingsResponse>;
