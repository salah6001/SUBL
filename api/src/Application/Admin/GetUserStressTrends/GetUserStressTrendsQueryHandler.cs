using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Domain.Alerts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.GetUserStressTrends;

internal sealed class GetUserStressTrendsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetUserStressTrendsQuery, List<StressTrendPoint>>
{
    public async Task<Result<List<StressTrendPoint>>> Handle(
        GetUserStressTrendsQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<List<StressTrendPoint>>(AlertErrors.Forbidden);
        }

        var readings = await context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == request.TargetUserId
                     && r.CreatedAt >= request.From
                     && r.CreatedAt <= request.To)
            .Select(r => new { r.CreatedAt, r.Score })
            .ToListAsync(cancellationToken);

        if (readings.Count == 0)
        {
            return Result.Success(new List<StressTrendPoint>());
        }

        TimeSpan bucketSize = request.Granularity switch
        {
            "Hour"  => TimeSpan.FromHours(1),
            "Week"  => TimeSpan.FromDays(7),
            "Month" => TimeSpan.FromDays(30),
            _       => TimeSpan.FromDays(1),
        };

        var buckets = readings
            .GroupBy(r => new DateTime(
                r.CreatedAt.Ticks / bucketSize.Ticks * bucketSize.Ticks,
                DateTimeKind.Utc))
            .OrderBy(g => g.Key)
            .Select(g => new StressTrendPoint(
                g.Key,
                g.Average(r => r.Score),
                g.Max(r => r.Score),
                g.Count()))
            .ToList();

        return Result.Success(buckets);
    }
}
