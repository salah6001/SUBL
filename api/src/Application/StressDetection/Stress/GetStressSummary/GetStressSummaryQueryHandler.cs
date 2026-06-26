using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using SharedKernel;

namespace Application.StressDetection.Stress.GetStressSummary;

internal sealed class GetStressSummaryQueryHandler(
    IStressReadingRepository stressRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetStressSummaryQuery, StressSummaryResponse>
{
    public async Task<Result<StressSummaryResponse>> Handle(
        GetStressSummaryQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressAggregates aggregates = await stressRepository.GetAggregatesAsync(
            userId, request.From, request.To, cancellationToken);

        var response = new StressSummaryResponse(
            TotalSessions: aggregates.TotalSessions,
            AvgStress: Math.Round(aggregates.AvgScore * 100, 1),
            PeakStress: Math.Round(aggregates.PeakScore * 100, 1),
            DominantEmotion: string.Empty,
            DominantLabel: string.Empty,
            HiddenStressCount: 0);

        return Result.Success(response);
    }
}
