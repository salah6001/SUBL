using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.EndSession;

internal sealed class EndSessionCommandHandler(
    IStressSessionRepository sessionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<EndSessionCommand>
{
    public async Task<Result> Handle(
        EndSessionCommand request,
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

        if (!session.IsActive())
        {
            return Result.Failure(StressSessionErrors.AlreadyEnded);
        }

        session.End(request.Reason);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
