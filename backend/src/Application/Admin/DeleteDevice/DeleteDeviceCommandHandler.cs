using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Alerts;
using Domain.StressDetection;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.DeleteDevice;

internal sealed class DeleteDeviceCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<DeleteDeviceCommand>
{
    public async Task<Result> Handle(DeleteDeviceCommand request, CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure(AlertErrors.Forbidden);
        }

        Device? device = await context.Devices
            .FirstOrDefaultAsync(d => d.Id == request.DeviceId, cancellationToken);

        if (device is null)
        {
            return Result.Failure(DeviceErrors.NotFound(request.DeviceId));
        }

        // Guard: only revoked/inactive devices can be hard-deleted. A live or
        // active device should be revoked first (an online agent re-registers).
        if (device.IsActive)
        {
            return Result.Failure(Error.Problem(
                "Devices.StillActive",
                "Only a revoked device can be permanently deleted. Revoke it first."));
        }

        context.Devices.Remove(device);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
