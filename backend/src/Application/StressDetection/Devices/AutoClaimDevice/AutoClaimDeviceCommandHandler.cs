using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.AutoClaimDevice;

internal sealed class AutoClaimDeviceCommandHandler(
    IDeviceRepository deviceRepository,
    IStressSessionRepository sessionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<AutoClaimDeviceCommand, AutoClaimDeviceResponse>
{
    public async Task<Result<AutoClaimDeviceResponse>> Handle(
        AutoClaimDeviceCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        // GetAllActiveAsync returns enabled devices, freshest (LastSeenAt) first.
        List<Device> devices = await deviceRepository.GetAllActiveAsync(cancellationToken);

        var online = devices.Where(d => d.IsOnline).ToList();

        // Already receiving data from an online device — nothing to do.
        Device? mine = online.FirstOrDefault(d => d.OwnerId == userId);
        if (mine is not null)
        {
            return Result.Success(new AutoClaimDeviceResponse(mine.Id, mine.DeviceName, Claimed: false));
        }

        // Otherwise take over the freshest online device that nobody has claimed.
        // Devices claimed by another real user are left alone.
        Device? candidate = online.FirstOrDefault(d => d.ClaimedByUserId is null);
        if (candidate is null)
        {
            return Result.Success(new AutoClaimDeviceResponse(null, null, Claimed: false));
        }

        candidate.Claim(userId);

        // End the registrant-owned session so the agent self-heals into a fresh
        // session attributed to this user on its next batch.
        StressSession? active = await sessionRepository.GetActiveForDeviceAsync(
            candidate.Id,
            cancellationToken);

        if (active is not null)
        {
            active.End("Device auto-claimed on login");
            sessionRepository.Update(active);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new AutoClaimDeviceResponse(candidate.Id, candidate.DeviceName, Claimed: true));
    }
}
