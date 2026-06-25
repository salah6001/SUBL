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
        // The caller is the desktop agent, identified by the account it
        // registered the device under (the "registrant").
        Guid registrantId = currentUserService.UserId;

        // 1) Validate device exists, was registered by the caller, and is active.
        Device? device = await deviceRepository.GetByIdForUserAsync(
            request.DeviceId,
            registrantId,
            cancellationToken);

        if (device is null)
        {
            return Result.Failure<Guid>(DeviceErrors.NotFound(request.DeviceId));
        }

        if (!device.IsActive)
        {
            return Result.Failure<Guid>(DeviceErrors.Revoked);
        }

        // The data belongs to whoever claimed the machine (or the registrant
        // when unclaimed), NOT necessarily the agent's own account.
        Guid ownerId = device.OwnerId;

        // 2) A user can only have one Active/Paused session at a time.
        StressSession? existingActive = await sessionRepository.GetActiveForUserAsync(
            ownerId,
            cancellationToken);

        if (existingActive is not null)
        {
            // If the same device already has an active session for this owner,
            // resume it idempotently — this keeps the agent robust across
            // restarts and re-claims instead of failing with AlreadyActive.
            if (existingActive.DeviceId == device.Id)
            {
                device.UpdateLastSeen();
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return Result.Success(existingActive.Id);
            }

            return Result.Failure<Guid>(StressSessionErrors.AlreadyActive(existingActive.Id));
        }

        // 3) Start the session (owned by the claimer) and refresh last-seen.
        var session = StressSession.Start(ownerId, device.Id, request.Notes);
        sessionRepository.Add(session);

        device.UpdateLastSeen();

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(session.Id);
    }
}
