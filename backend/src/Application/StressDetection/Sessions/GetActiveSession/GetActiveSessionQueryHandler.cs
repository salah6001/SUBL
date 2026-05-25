using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.GetActiveSession;

internal sealed class GetActiveSessionQueryHandler(
    IStressSessionRepository sessionRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetActiveSessionQuery, SessionResponse?>
{
    public async Task<Result<SessionResponse?>> Handle(
        GetActiveSessionQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressSession? session = await sessionRepository.GetActiveForUserAsync(
            userId,
            cancellationToken);

        if (session is null)
        {
            return Result.Success<SessionResponse?>(null);
        }

        var response = new SessionResponse(
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
            session.EndReason);

        return Result.Success<SessionResponse?>(response);
    }
}
