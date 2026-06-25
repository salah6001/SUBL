using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Privacy.Common;
using Domain.Privacy;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Privacy.GetPrivacySettings;

internal sealed class GetPrivacySettingsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetPrivacySettingsQuery, PrivacySettingsResponse>
{
    public async Task<Result<PrivacySettingsResponse>> Handle(
        GetPrivacySettingsQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        UserPrivacySettings? settings = await context.UserPrivacySettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        // Fall back to defaults if the user has never saved settings.
        settings ??= UserPrivacySettings.CreateDefault(userId);

        var response = new PrivacySettingsResponse(
            settings.KeystrokeDynamics,
            settings.SentimentAnalysis,
            settings.ProductAnalytics,
            settings.EmployerDataSharing);

        return Result.Success(response);
    }
}
