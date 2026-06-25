namespace Domain.Alerts;

/// <summary>
/// What kind of condition raised the alert.
/// </summary>
public enum AlertCategory
{
    HighStress = 1,
    CriticalStress = 2,
    SustainedStress = 3,
    Anomaly = 4
}

/// <summary>
/// How serious the alert is.
/// </summary>
public enum AlertSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

/// <summary>
/// Where the alert is in its handling lifecycle.
/// </summary>
public enum AlertStatus
{
    Open = 1,
    Acknowledged = 2,
    Resolved = 3
}
