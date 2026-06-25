using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.DeviceSettings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.DeviceSettings.GetMyPreferences;

internal sealed class GetMyPreferencesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetMyPreferencesQuery, PreferencesResponse>
{
    public async Task<Result<PreferencesResponse>> Handle(
        GetMyPreferencesQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        UserDeviceSettings? settings = await context.UserDeviceSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        // No row yet → return defaults without persisting.
        if (settings is null)
        {
            return Result.Success(new PreferencesResponse("system", "en-US", "UTC", "MM/DD/YYYY"));
        }

        return Result.Success(new PreferencesResponse(
            settings.Theme,
            settings.Language,
            settings.Timezone,
            settings.DateFormat));
    }
}
