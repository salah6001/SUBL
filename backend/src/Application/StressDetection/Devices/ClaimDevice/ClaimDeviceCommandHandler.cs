using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.ClaimDevice;

internal sealed class ClaimDeviceCommandHandler(
    IDeviceRepository deviceRepository,
    IStressSessionRepository sessionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<ClaimDeviceCommand>
{
    public async Task<Result> Handle(
        ClaimDeviceCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        Device? device = await deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device is null)
        {
            return Result.Failure(DeviceErrors.NotFound(request.DeviceId));
        }

        if (!device.IsActive)
        {
            return Result.Failure(DeviceErrors.Revoked);
        }

        // Already feeding this user — nothing to do.
        if (device.OwnerId == userId)
        {
            return Result.Success();
        }

        device.Claim(userId);

        // End the device's current session (owned by the previous claimer) so
        // the agent self-heals into a fresh session attributed to the new owner
        // on its next batch, instead of keeping the old attribution.
        StressSession? active = await sessionRepository.GetActiveForDeviceAsync(
            device.Id,
            cancellationToken);

        if (active is not null)
        {
            active.End("Device re-claimed by another user");
            sessionRepository.Update(active);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
