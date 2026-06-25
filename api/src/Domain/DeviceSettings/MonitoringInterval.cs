namespace Domain.DeviceSettings;

/// <summary>
/// How often the desktop agent samples keyboard metrics. Values are minutes.
/// </summary>
public enum MonitoringInterval
{
    FifteenMinutes = 15,
    ThirtyMinutes = 30,
    OneHour = 60
}
