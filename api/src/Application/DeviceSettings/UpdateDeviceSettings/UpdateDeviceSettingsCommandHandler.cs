using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.DeviceSettings.Common;
using Domain.DeviceSettings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.DeviceSettings.UpdateDeviceSettings;

internal sealed class UpdateDeviceSettingsCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdateDeviceSettingsCommand, DeviceSettingsResponse>
{
    public async Task<Result<DeviceSettingsResponse>> Handle(
        UpdateDeviceSettingsCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        UserDeviceSettings? settings = await context.UserDeviceSettings
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (settings is null)
        {
            settings = UserDeviceSettings.CreateDefault(userId);
            context.UserDeviceSettings.Add(settings);
        }

        settings.Update(
            request.Language,
            request.Timezone,
            request.DateFormat,
            request.StressThreshold,
            request.MonitoringInterval);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(DeviceSettingsMapper.ToResponse(settings));
    }
}
