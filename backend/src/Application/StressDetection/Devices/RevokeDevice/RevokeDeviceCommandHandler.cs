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

        Device? device = await deviceRepository.GetByIdForUserAsync(
            request.DeviceId,
            userId,
            cancellationToken);

        if (device is null)
        {
            return Result.Failure(DeviceErrors.NotFound(request.DeviceId));
        }

        device.Revoke();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
