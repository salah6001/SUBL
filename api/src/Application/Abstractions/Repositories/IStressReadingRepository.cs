using Domain.StressDetection;

namespace Application.Abstractions.Repositories;

/// <summary>
/// Repository interface for KeyboardMetrics and StressReading persistence and queries.
/// </summary>
public interface IStressReadingRepository
{
    /// <summary>
    /// Adds a new keyboard metrics row.
    /// </summary>
    void AddMetrics(KeyboardMetrics metrics);

    /// <summary>
    /// Adds a new stress reading.
    /// </summary>
    void AddReading(StressReading reading);

    /// <summary>
    /// Gets a single reading by id, scoped to the given user.
    /// </summary>
    Task<StressReading?> GetReadingAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the user's most recent stress reading (across all sessions).
    /// </summary>
    Task<StressReading?> GetLatestReadingAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns paginated stress readings for the user across the given time window.
    /// </summary>
    Task<(List<StressReading> Items, int TotalCount)> GetReadingsForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        DateTime? from = null,
        DateTime? to = null,
        Guid? sessionId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns ordered stress readings for a session.
    /// </summary>
    Task<List<StressReading>> GetReadingsForSessionAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Aggregates the user's stress readings into time buckets between
    /// <paramref name="from"/> and <paramref name="to"/>.
    /// </summary>
    Task<List<StressTrendBucket>> GetTrendsAsync(
        Guid userId,
        DateTime from,
        DateTime to,
        TimeSpan bucketSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Counts the user's stress readings per <see cref="Domain.StressDetection.StressLevel"/>
    /// between <paramref name="from"/> and <paramref name="to"/>.
    /// </summary>
    Task<List<StressLevelCount>> GetLevelDistributionAsync(
        Guid userId,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns aggregate stress stats (avg score, peak score, session count) for the given window.
    /// </summary>
    Task<StressAggregates> GetAggregatesAsync(
        Guid userId,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// One bucket in a stress time-series. Layered output type that lives at the
/// repository contract level so handlers can map it to any DTO they need.
/// </summary>
public sealed record StressTrendBucket(
    DateTime BucketStart,
    double AverageScore,
    double PeakScore,
    int ReadingsCount);

/// <summary>
/// The number of readings recorded at a given stress level.
/// </summary>
public sealed record StressLevelCount(
    Domain.StressDetection.StressLevel Level,
    int Count);

/// <summary>
/// Aggregate stress statistics over a time window.
/// </summary>
public sealed record StressAggregates(
    int TotalReadings,
    int TotalSessions,
    double AvgScore,
    double PeakScore);
