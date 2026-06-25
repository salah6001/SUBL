using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.GetMyDevices;

internal sealed class GetMyDevicesQueryHandler(
    IDeviceRepository deviceRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetMyDevicesQuery, List<DeviceResponse>>
{
    public async Task<Result<List<DeviceResponse>>> Handle(
        GetMyDevicesQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        List<Device> devices = await deviceRepository.GetByUserIdAsync(userId, cancellationToken);

        if (!request.IncludeRevoked)
        {
            devices = devices.Where(d => d.IsActive).ToList();
        }

        var response = devices
            .OrderByDescending(d => d.LastSeenAt ?? d.CreatedAt)
            .Select(d => new DeviceResponse(
                d.Id,
                d.DeviceName,
                d.Platform.ToString(),
                d.OsVersion,
                d.AgentVersion,
                d.IsActive,
                d.LastSeenAt,
                d.LastIpAddress,
                d.CreatedAt,
                d.RevokedAt))
            .ToList();

        return Result.Success(response);
    }
}
