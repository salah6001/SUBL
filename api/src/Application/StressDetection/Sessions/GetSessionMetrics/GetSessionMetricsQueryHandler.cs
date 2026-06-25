using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.GetSessionMetrics;

internal sealed class GetSessionMetricsQueryHandler(
    IStressSessionRepository sessionRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetSessionMetricsQuery, SessionMetricsResponse>
{
    public async Task<Result<SessionMetricsResponse>> Handle(
        GetSessionMetricsQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressSession? session = await sessionRepository.GetByIdForUserAsync(
            request.SessionId,
            userId,
            cancellationToken);

        if (session is null)
        {
            return Result.Failure<SessionMetricsResponse>(
                StressSessionErrors.NotFound(request.SessionId));
        }

        int totalReadings = session.Readings.Count;

        // Distribution across every level, so charts have a stable shape.
        var distribution = Enum.GetValues<StressLevel>()
            .Select(level =>
            {
                int count = session.Readings.Count(r => r.Level == level);
                double percentage = totalReadings == 0
                    ? 0
                    : Math.Round((double)count / totalReadings * 100, 2);

                return new StressDistributionSlice(level.ToString(), count, percentage);
            })
            .ToList();

        double minScore = totalReadings == 0
            ? 0
            : session.Readings.Min(r => r.Score);

        var response = new SessionMetricsResponse(
            session.Id,
            session.Status.ToString(),
            session.StartedAt,
            session.EndedAt,
            session.Duration().TotalSeconds,
            session.MetricsCount,
            session.ReadingsCount,
            session.AverageStressScore,
            session.PeakStressScore,
            minScore,
            distribution);

        return Result.Success(response);
    }
}
