using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Stress.GetDistribution;

internal sealed class GetDistributionQueryHandler(
    IStressReadingRepository stressRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetDistributionQuery, StressDistributionResponse>
{
    public async Task<Result<StressDistributionResponse>> Handle(
        GetDistributionQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        List<StressLevelCount> counts = await stressRepository.GetLevelDistributionAsync(
            userId,
            request.From,
            request.To,
            cancellationToken);

        int total = counts.Sum(c => c.Count);

        // Emit every level (including zero counts) so charts have a stable shape.
        var slices = Enum.GetValues<StressLevel>()
            .Select(level =>
            {
                int count = counts
                    .Where(c => c.Level == level)
                    .Sum(c => c.Count);

                double percentage = total == 0
                    ? 0
                    : Math.Round((double)count / total * 100, 2);

                return new StressDistributionSlice(level.ToString(), count, percentage);
            })
            .ToList();

        var response = new StressDistributionResponse(
            request.From,
            request.To,
            total,
            slices);

        return Result.Success(response);
    }
}
