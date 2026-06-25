using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Privacy.Common;
using Domain.Privacy;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Privacy.UpdatePrivacySettings;

internal sealed class UpdatePrivacySettingsCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdatePrivacySettingsCommand, PrivacySettingsResponse>
{
    public async Task<Result<PrivacySettingsResponse>> Handle(
        UpdatePrivacySettingsCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        UserPrivacySettings? settings = await context.UserPrivacySettings
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (settings is null)
        {
            settings = UserPrivacySettings.CreateDefault(userId);
            context.UserPrivacySettings.Add(settings);
        }

        settings.Update(
            request.KeystrokeDynamics,
            request.SentimentAnalysis,
            request.ProductAnalytics,
            request.EmployerDataSharing);

        await context.SaveChangesAsync(cancellationToken);

        var response = new PrivacySettingsResponse(
            settings.KeystrokeDynamics,
            settings.SentimentAnalysis,
            settings.ProductAnalytics,
            settings.EmployerDataSharing);

        return Result.Success(response);
    }
}
