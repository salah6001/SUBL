using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.GetSessions;

internal sealed class GetSessionsQueryHandler(
    IStressSessionRepository sessionRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetSessionsQuery, PagedResult<SessionResponse>>
{
    public async Task<Result<PagedResult<SessionResponse>>> Handle(
        GetSessionsQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        (List<StressSession> sessions, int totalCount) = await sessionRepository.GetPaginatedAsync(
            userId,
            request.Page,
            request.PageSize,
            request.From,
            request.To,
            cancellationToken);

        var items = sessions.Select(s => new SessionResponse(
            s.Id,
            s.DeviceId,
            s.Device?.DeviceName,
            s.Status.ToString(),
            s.StartedAt,
            s.EndedAt,
            s.LastActivityAt,
            s.Duration().TotalSeconds,
            s.MetricsCount,
            s.ReadingsCount,
            s.AverageStressScore,
            s.PeakStressScore,
            s.Notes,
            s.EndReason)).ToList();

        var result = PagedResult<SessionResponse>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount);

        return Result.Success(result);
    }
}
