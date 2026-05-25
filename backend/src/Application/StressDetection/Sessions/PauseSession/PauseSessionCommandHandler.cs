using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.PauseSession;

internal sealed class PauseSessionCommandHandler(
    IStressSessionRepository sessionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<PauseSessionCommand>
{
    public async Task<Result> Handle(
        PauseSessionCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressSession? session = await sessionRepository.GetByIdForUserAsync(
            request.SessionId,
            userId,
            cancellationToken);

        if (session is null)
        {
            return Result.Failure(StressSessionErrors.NotFound(request.SessionId));
        }

        if (session.Status != SessionStatus.Active)
        {
            return Result.Failure(StressSessionErrors.NotActive);
        }

        session.Pause();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
