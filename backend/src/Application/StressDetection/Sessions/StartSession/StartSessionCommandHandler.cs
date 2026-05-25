using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Sessions.StartSession;

internal sealed class StartSessionCommandHandler(
    IStressSessionRepository sessionRepository,
    IDeviceRepository deviceRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<StartSessionCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        StartSessionCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        // 1) Validate device exists, belongs to user, and is active.
        Device? device = await deviceRepository.GetByIdForUserAsync(
            request.DeviceId,
            userId,
            cancellationToken);

        if (device is null)
        {
            return Result.Failure<Guid>(DeviceErrors.NotFound(request.DeviceId));
        }

        if (!device.IsActive)
        {
            return Result.Failure<Guid>(DeviceErrors.Revoked);
        }

        // 2) A user can only have one Active/Paused session at a time.
        StressSession? existingActive = await sessionRepository.GetActiveForUserAsync(
            userId,
            cancellationToken);

        if (existingActive is not null)
        {
            return Result.Failure<Guid>(StressSessionErrors.AlreadyActive(existingActive.Id));
        }

        // 3) Start the session and refresh the device's last-seen.
        var session = StressSession.Start(userId, device.Id, request.Notes);
        sessionRepository.Add(session);

        device.UpdateLastSeen();

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(session.Id);
    }
}
