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
    private static readonly Dictionary<string, string> EmotionLabels = new()
    {
        ["A"] = "Angry",
        ["C"] = "Calm",
        ["H"] = "Happy",
        ["N"] = "Neutral",
        ["S"] = "Sad"
    };

    public async Task<Result<StressSummaryResponse>> Handle(
        GetStressSummaryQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressAggregates aggregates = await stressRepository.GetAggregatesAsync(
            userId, request.From, request.To, cancellationToken);

        Dictionary<string, int> emotionCounts = await stressRepository.GetEmotionCountsAsync(
            userId, request.From, request.To, cancellationToken);

        string dominantCode = "";
        string dominantLabel = "";
        if (emotionCounts.Count > 0)
        {
            dominantCode = emotionCounts.MaxBy(kv => kv.Value).Key;
            EmotionLabels.TryGetValue(dominantCode, out dominantLabel!);
            dominantLabel ??= dominantCode;
        }

        var response = new StressSummaryResponse(
            TotalSessions: aggregates.TotalSessions,
            AvgStress: Math.Round(aggregates.AvgScore * 100, 1),
            PeakStress: Math.Round(aggregates.PeakScore * 100, 1),
            DominantEmotion: dominantCode,
            DominantLabel: dominantLabel,
            HiddenStressCount: 0);

        return Result.Success(response);
    }
}
