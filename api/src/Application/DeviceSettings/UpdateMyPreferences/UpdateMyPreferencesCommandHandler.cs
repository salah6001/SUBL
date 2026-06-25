using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.DeviceSettings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.DeviceSettings.UpdateMyPreferences;

internal sealed class UpdateMyPreferencesCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdateMyPreferencesCommand, PreferencesResponse>
{
    private static readonly string[] AllowedThemes = ["light", "dark", "system"];

    public async Task<Result<PreferencesResponse>> Handle(
        UpdateMyPreferencesCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        string theme = AllowedThemes.Contains(request.Theme) ? request.Theme : "system";
        string language = string.IsNullOrWhiteSpace(request.Language) ? "en-US" : request.Language;
        string timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "UTC" : request.Timezone;
        string dateFormat = string.IsNullOrWhiteSpace(request.DateFormat) ? "MM/DD/YYYY" : request.DateFormat;

        UserDeviceSettings? settings = await context.UserDeviceSettings
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (settings is null)
        {
            settings = UserDeviceSettings.CreateDefault(userId);
            context.UserDeviceSettings.Add(settings);
        }

        settings.UpdatePreferences(theme, language, timezone, dateFormat);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(new PreferencesResponse(
            settings.Theme,
            settings.Language,
            settings.Timezone,
            settings.DateFormat));
    }
}
