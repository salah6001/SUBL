using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.GetSessionById;

internal sealed class GetSessionByIdQueryHandler(
    IStressSessionRepository sessionRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetSessionByIdQuery, SessionDetailResponse>
{
    public async Task<Result<SessionDetailResponse>> Handle(
        GetSessionByIdQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressSession? session = await sessionRepository.GetByIdForUserAsync(
            request.SessionId,
            userId,
            cancellationToken);

        if (session is null)
        {
            return Result.Failure<SessionDetailResponse>(
                StressSessionErrors.NotFound(request.SessionId));
        }

        var readings = session.Readings
            .OrderBy(r => r.CreatedAt)
            .Select(r => new StressReadingResponse(
                r.Id,
                r.SessionId,
                r.Score,
                r.Level.ToString(),
                r.Confidence,
                r.ModelVersion,
                r.Emotion,
                r.CreatedAt))
            .ToList();

        var response = new SessionDetailResponse(
            session.Id,
            session.DeviceId,
            session.Device?.DeviceName,
            session.Status.ToString(),
            session.StartedAt,
            session.EndedAt,
            session.LastActivityAt,
            session.Duration().TotalSeconds,
            session.MetricsCount,
            session.ReadingsCount,
            session.AverageStressScore,
            session.PeakStressScore,
            session.Notes,
            session.EndReason,
            readings);

        return Result.Success(response);
    }
}
