using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.PingDevice;

internal sealed class PingDeviceCommandHandler(
    IDeviceRepository deviceRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<PingDeviceCommand>
{
    public async Task<Result> Handle(
        PingDeviceCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        Device? device = await deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device is null)
        {
            return Result.Failure(DeviceErrors.NotFound(request.DeviceId));
        }

        // Only the registrant (the agent's own identity) may heartbeat the device.
        if (device.UserId != userId)
        {
            return Result.Failure(DeviceErrors.NotOwnedByUser);
        }

        if (!device.IsActive)
        {
            return Result.Failure(DeviceErrors.Revoked);
        }

        device.UpdateLastSeen(request.IpAddress);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
