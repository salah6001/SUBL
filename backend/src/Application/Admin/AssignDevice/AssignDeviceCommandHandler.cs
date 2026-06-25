using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.Alerts;
using Domain.StressDetection;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.AssignDevice;

internal sealed class AssignDeviceCommandHandler(
    IDeviceRepository deviceRepository,
    IStressSessionRepository sessionRepository,
    IApplicationDbContext context,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<AssignDeviceCommand>
{
    public async Task<Result> Handle(
        AssignDeviceCommand request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure(AlertErrors.Forbidden);
        }

        Device? device = await deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device is null)
        {
            return Result.Failure(DeviceErrors.NotFound(request.DeviceId));
        }

        if (request.UserId is Guid targetUserId)
        {
            bool userExists = await context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == targetUserId, cancellationToken);

            if (!userExists)
            {
                return Result.Failure(UserErrors.NotFound(targetUserId));
            }

            if (device.OwnerId == targetUserId)
            {
                return Result.Success();
            }

            device.Claim(targetUserId);
        }
        else
        {
            device.Unclaim();
        }

        // End the device's current session so its keystroke data re-attributes
        // to the new owner on the agent's next batch.
        StressSession? active = await sessionRepository.GetActiveForDeviceAsync(
            device.Id,
            cancellationToken);

        if (active is not null)
        {
            active.End("Device reassigned by administrator");
            sessionRepository.Update(active);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
