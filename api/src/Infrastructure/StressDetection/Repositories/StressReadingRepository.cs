using Application.Abstractions.Repositories;
using Domain.StressDetection;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.StressDetection.Repositories;

internal sealed class StressReadingRepository(ApplicationDbContext context) : IStressReadingRepository
{
    public void AddMetrics(KeyboardMetrics metrics) => context.KeyboardMetrics.Add(metrics);

    public void AddReading(StressReading reading) => context.StressReadings.Add(reading);

    public Task<StressReading?> GetReadingAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.StressReadings
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId, cancellationToken);

    public Task<StressReading?> GetLatestReadingAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(List<StressReading> Items, int TotalCount)> GetReadingsForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        DateTime? from = null,
        DateTime? to = null,
        Guid? sessionId = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<StressReading> query = context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == userId);

        if (sessionId.HasValue)
        {
            query = query.Where(r => r.SessionId == sessionId.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(r => r.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(r => r.CreatedAt <= to.Value);
        }

        int total = await query.CountAsync(cancellationToken);

        List<StressReading> items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<List<StressReading>> GetReadingsForSessionAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.StressReadings
            .AsNoTracking()
            .Where(r => r.SessionId == sessionId && r.UserId == userId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<List<StressTrendBucket>> GetTrendsAsync(
        Guid userId,
        DateTime from,
        DateTime to,
        TimeSpan bucketSize,
        CancellationToken cancellationToken = default)
    {
        // Pull only the rows we need, then bucket in memory.
        // For very large date ranges this should be replaced with a
        // PostgreSQL date_trunc / time_bucket query, but for typical
        // graduation-project loads (a few thousand rows) this is fine
        // and stays portable across providers.
        List<StressReading> rows = await context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == userId &&
                        r.CreatedAt >= from &&
                        r.CreatedAt <= to)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return [];
        }

        long bucketTicks = bucketSize.Ticks;

        return rows
            .GroupBy(r => new DateTime(
                r.CreatedAt.Ticks - r.CreatedAt.Ticks % bucketTicks,
                DateTimeKind.Utc))
            .OrderBy(g => g.Key)
            .Select(g => new StressTrendBucket(
                BucketStart: g.Key,
                AverageScore: g.Average(r => r.Score),
                PeakScore: g.Max(r => r.Score),
                ReadingsCount: g.Count()))
            .ToList();
    }

    public async Task<List<StressLevelCount>> GetLevelDistributionAsync(
        Guid userId,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        List<StressLevelCount> counts = await context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == userId &&
                        r.CreatedAt >= from &&
                        r.CreatedAt <= to)
            .GroupBy(r => r.Level)
            .Select(g => new StressLevelCount(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        return counts;
    }

    public async Task<StressAggregates> GetAggregatesAsync(
        Guid userId,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        var readings = await context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == userId &&
                        r.CreatedAt >= from &&
                        r.CreatedAt <= to)
            .Select(r => new { r.Score, r.SessionId })
            .ToListAsync(cancellationToken);

        if (readings.Count == 0)
        {
            return new StressAggregates(0, 0, 0, 0);
        }

        int totalSessions = readings.Select(r => r.SessionId).Distinct().Count();
        double avg = readings.Average(r => r.Score);
        double peak = readings.Max(r => r.Score);

        return new StressAggregates(readings.Count, totalSessions, avg, peak);
    }
}
