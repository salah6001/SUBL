using Application.Abstractions.Messaging;
using Application.DeviceSettings.Common;

namespace Application.DeviceSettings.GetDeviceSettings;

public sealed record GetDeviceSettingsQuery : IQuery<DeviceSettingsResponse>;
