using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.RevokeDevice;

internal sealed class RevokeDeviceCommandHandler(
    IDeviceRepository deviceRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<RevokeDeviceCommand>
{
    public async Task<Result> Handle(
        RevokeDeviceCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        // A device may be removed by the account that registered it OR by the
        // account currently feeding from it (the claimer). This lets a user
        // clean stale/offline machines out of their monitoring list.
        Device? device = await deviceRepository.GetByIdAsync(
            request.DeviceId,
            cancellationToken);

        if (device is null || device.UserId != userId && device.ClaimedByUserId != userId)
        {
            return Result.Failure(DeviceErrors.NotFound(request.DeviceId));
        }

        device.Revoke();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
