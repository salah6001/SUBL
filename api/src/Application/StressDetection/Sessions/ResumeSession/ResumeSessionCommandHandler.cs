using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.ResumeSession;

internal sealed class ResumeSessionCommandHandler(
    IStressSessionRepository sessionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<ResumeSessionCommand>
{
    public async Task<Result> Handle(
        ResumeSessionCommand request,
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

        if (session.Status != SessionStatus.Paused)
        {
            return Result.Failure(StressSessionErrors.NotActive);
        }

        session.Resume();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
