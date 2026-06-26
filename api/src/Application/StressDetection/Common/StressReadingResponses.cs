namespace Application.StressDetection.Common;

/// <summary>
/// Response DTO for a single stress reading.
/// </summary>
public sealed record StressReadingResponse(
    Guid Id,
    Guid SessionId,
    double Score,
    string Level,
    double Confidence,
    string ModelVersion,
    DateTime CreatedAt);

/// <summary>
/// Response DTO returned when an agent submits keyboard metrics.
/// Carries the resulting reading so the agent can show feedback to the user.
/// </summary>
public sealed record SubmitMetricsResponse(
    Guid MetricsId,
    Guid ReadingId,
    double Score,
    string Level,
    double Confidence);

/// <summary>
/// Aggregated KPIs for the GET /stress/summary endpoint.
/// Scores are on a 0–100 scale.
/// </summary>
public sealed record StressSummaryResponse(
    int TotalSessions,
    double AvgStress,
    double PeakStress,
    string DominantEmotion,
    string DominantLabel,
    int HiddenStressCount);

/// <summary>
/// One bucket in a time-series of average stress.
/// </summary>
public sealed record StressTrendPoint(
    DateTime BucketStart,
    double AverageScore,
    double PeakScore,
    int ReadingsCount);

/// <summary>
/// Count and share of readings for a single stress level over a window.
/// </summary>
public sealed record StressDistributionSlice(
    string Level,
    int Count,
    double Percentage);

/// <summary>
/// Distribution of the user's stress readings across levels, for pie/bar charts.
/// </summary>
public sealed record StressDistributionResponse(
    DateTime From,
    DateTime To,
    int TotalReadings,
    IReadOnlyList<StressDistributionSlice> Slices);

/// <summary>
/// Aggregated stress for a single organizational department.
/// </summary>
public sealed record DepartmentStressSlice(
    string Department,
    int UserCount,
    int ReadingsCount,
    double AverageStressScore,
    double PeakStressScore);

/// <summary>
/// Stress aggregated per department over a window (admin analytics view).
/// </summary>
public sealed record DepartmentStressResponse(
    DateTime From,
    DateTime To,
    IReadOnlyList<DepartmentStressSlice> Departments);

/// <summary>
/// Snapshot of the user's most recent stress reading.
/// </summary>
public sealed record CurrentStressResponse(
    bool HasData,
    double? Score,
    string? Level,
    DateTime? At,
    Guid? SessionId);
