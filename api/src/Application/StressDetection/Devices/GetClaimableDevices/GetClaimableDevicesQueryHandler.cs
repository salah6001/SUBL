using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Devices.GetClaimableDevices;

internal sealed class GetClaimableDevicesQueryHandler(
    IDeviceRepository deviceRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetClaimableDevicesQuery, List<ClaimableDeviceResponse>>
{
    public async Task<Result<List<ClaimableDeviceResponse>>> Handle(
        GetClaimableDevicesQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        List<Device> devices = await deviceRepository.GetAllActiveAsync(cancellationToken);

        var response = devices
            .Select(d => new ClaimableDeviceResponse(
                d.Id,
                d.DeviceName,
                d.Platform.ToString(),
                d.LastSeenAt,
                d.IsActive,
                IsOnline: d.IsOnline,
                ClaimedByMe: d.OwnerId == userId,
                ClaimedByOther: d.OwnerId != userId))
            .ToList();

        return Result.Success(response);
    }
}
