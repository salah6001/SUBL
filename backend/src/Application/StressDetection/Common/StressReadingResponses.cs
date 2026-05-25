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
/// One bucket in a time-series of average stress.
/// </summary>
public sealed record StressTrendPoint(
    DateTime BucketStart,
    double AverageScore,
    double PeakScore,
    int ReadingsCount);

/// <summary>
/// Snapshot of the user's most recent stress reading.
/// </summary>
public sealed record CurrentStressResponse(
    bool HasData,
    double? Score,
    string? Level,
    DateTime? At,
    Guid? SessionId);
