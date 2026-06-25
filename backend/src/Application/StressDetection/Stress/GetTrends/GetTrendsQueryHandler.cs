using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using SharedKernel;

namespace Application.StressDetection.Stress.GetTrends;

internal sealed class GetTrendsQueryHandler(
    IStressReadingRepository stressRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetTrendsQuery, List<StressTrendPoint>>
{
    public async Task<Result<List<StressTrendPoint>>> Handle(
        GetTrendsQuery request,
        CancellationToken cancellationToken)
    {
        Guid currentUserId = currentUserService.UserId;

        // Resolve whose trends to return. Viewing another user's trends is an
        // admin/analytics action; restrict it to super admins.
        Guid userId = currentUserId;
        if (request.UserId is { } requestedUserId && requestedUserId != currentUserId)
        {
            if (!currentUserService.IsSuperAdmin)
            {
                return Result.Failure<List<StressTrendPoint>>(Error.Forbidden(
                    "Stress.Trends.Forbidden",
                    "You are not allowed to view another user's stress trends."));
            }

            userId = requestedUserId;
        }

        TimeSpan bucket = request.Granularity.ToUpperInvariant() switch
        {
            "MINUTE" => TimeSpan.FromMinutes(1),
            "HOUR" => TimeSpan.FromHours(1),
            "WEEK" => TimeSpan.FromDays(7),
            _ => TimeSpan.FromDays(1) // Default Day
        };

        List<StressTrendBucket> buckets = await stressRepository.GetTrendsAsync(
            userId,
            request.From,
            request.To,
            bucket,
            cancellationToken);

        var points = buckets
            .Select(b => new StressTrendPoint(
                b.BucketStart,
                b.AverageScore,
                b.PeakScore,
                b.ReadingsCount))
            .ToList();

        return Result.Success(points);
    }
}
