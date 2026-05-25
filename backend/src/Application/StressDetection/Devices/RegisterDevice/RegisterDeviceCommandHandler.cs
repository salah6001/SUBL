using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.RegisterDevice;

internal sealed class RegisterDeviceCommandHandler(
    IDeviceRepository deviceRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<RegisterDeviceCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        RegisterDeviceCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        if (!Enum.TryParse<DevicePlatform>(request.Platform, true, out DevicePlatform platform))
        {
            return Result.Failure<Guid>(DeviceErrors.InvalidPlatform(request.Platform));
        }

        // Idempotent re-registration: same user + same fingerprint → reuse the row.
        Device? existing = await deviceRepository.GetByFingerprintAsync(
            userId,
            request.DeviceFingerprint,
            cancellationToken);

        if (existing is not null)
        {
            existing.UpdateAgentInfo(request.OsVersion, request.AgentVersion);
            existing.UpdateLastSeen(request.IpAddress);

            if (!existing.IsActive)
            {
                existing.Reactivate();
            }

            // Allow renaming during re-registration
            if (!string.IsNullOrWhiteSpace(request.DeviceName) &&
                !string.Equals(existing.DeviceName, request.DeviceName, StringComparison.Ordinal))
            {
                existing.Rename(request.DeviceName);
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(existing.Id);
        }

        var device = Device.Register(
            userId,
            request.DeviceName,
            request.DeviceFingerprint,
            platform,
            request.OsVersion,
            request.AgentVersion,
            request.IpAddress);

        deviceRepository.Add(device);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(device.Id);
    }
}
