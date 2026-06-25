namespace Application.StressDetection.Common;

/// <summary>
/// Response DTO for a stress monitoring session (summary view).
/// </summary>
public sealed record SessionResponse(
    Guid Id,
    Guid DeviceId,
    string? DeviceName,
    string Status,
    DateTime StartedAt,
    DateTime? EndedAt,
    DateTime? LastActivityAt,
    double DurationSeconds,
    int MetricsCount,
    int ReadingsCount,
    double AverageStressScore,
    double PeakStressScore,
    string? Notes,
    string? EndReason);

/// <summary>
/// Aggregated metrics for a single session (no per-reading payload), including
/// the distribution of readings across stress levels for in-session charts.
/// </summary>
public sealed record SessionMetricsResponse(
    Guid SessionId,
    string Status,
    DateTime StartedAt,
    DateTime? EndedAt,
    double DurationSeconds,
    int MetricsCount,
    int ReadingsCount,
    double AverageStressScore,
    double PeakStressScore,
    double MinStressScore,
    IReadOnlyList<StressDistributionSlice> LevelDistribution);

/// <summary>
/// Detailed response DTO for a single session including its stress readings.
/// </summary>
public sealed record SessionDetailResponse(
    Guid Id,
    Guid DeviceId,
    string? DeviceName,
    string Status,
    DateTime StartedAt,
    DateTime? EndedAt,
    DateTime? LastActivityAt,
    double DurationSeconds,
    int MetricsCount,
    int ReadingsCount,
    double AverageStressScore,
    double PeakStressScore,
    string? Notes,
    string? EndReason,
    List<StressReadingResponse> Readings);
