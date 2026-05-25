using Application.Abstractions.Repositories;
using Domain.StressDetection;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.StressDetection.Repositories;

internal sealed class StressSessionRepository(ApplicationDbContext context) : IStressSessionRepository
{
    public Task<StressSession?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        context.StressSessions
            .Include(s => s.Device)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public Task<StressSession?> GetByIdForUserAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.StressSessions
            .Include(s => s.Device)
            .Include(s => s.Readings)
            .FirstOrDefaultAsync(
                s => s.Id == id && s.UserId == userId,
                cancellationToken);

    public Task<StressSession?> GetActiveForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.StressSessions
            .Include(s => s.Device)
            .Where(s => s.UserId == userId &&
                (s.Status == SessionStatus.Active || s.Status == SessionStatus.Paused))
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<(List<StressSession> Items, int TotalCount)> GetPaginatedAsync(
        Guid userId,
        int page,
        int pageSize,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<StressSession> query = context.StressSessions
            .AsNoTracking()
            .Include(s => s.Device)
            .Where(s => s.UserId == userId);

        if (from.HasValue)
        {
            query = query.Where(s => s.StartedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(s => s.StartedAt <= to.Value);
        }

        int total = await query.CountAsync(cancellationToken);

        List<StressSession> items = await query
            .OrderByDescending(s => s.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<List<StressSession>> GetStaleActiveAsync(
        DateTime olderThan,
        CancellationToken cancellationToken = default) =>
        context.StressSessions
            .Where(s =>
                (s.Status == SessionStatus.Active || s.Status == SessionStatus.Paused) &&
                (s.LastActivityAt == null || s.LastActivityAt < olderThan))
            .ToListAsync(cancellationToken);

    public void Add(StressSession session) => context.StressSessions.Add(session);

    public void Update(StressSession session) => context.StressSessions.Update(session);
}
