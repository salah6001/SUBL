namespace Application.Admin.Common;

/// <summary>
/// Organization-wide wellbeing KPIs for the admin dashboard.
/// </summary>
public sealed record AdminKpisResponse(
    double WellnessScore,
    int TeamsAtRisk,
    int TotalEmployees,
    double OverallStressPercent,
    DateTime From,
    DateTime To);
