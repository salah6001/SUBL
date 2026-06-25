using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.DeviceSettings.Common;
using Domain.DeviceSettings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.DeviceSettings.GetDeviceSettings;

internal sealed class GetDeviceSettingsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetDeviceSettingsQuery, DeviceSettingsResponse>
{
    public async Task<Result<DeviceSettingsResponse>> Handle(
        GetDeviceSettingsQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        UserDeviceSettings? settings = await context.UserDeviceSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        settings ??= UserDeviceSettings.CreateDefault(userId);

        return Result.Success(DeviceSettingsMapper.ToResponse(settings));
    }
}
