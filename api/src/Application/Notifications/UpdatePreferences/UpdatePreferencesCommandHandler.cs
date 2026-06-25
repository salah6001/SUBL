using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.Notifications;
using SharedKernel;

namespace Application.Notifications.UpdatePreferences;

internal sealed class UpdatePreferencesCommandHandler(
    IUserNotificationPreferencesRepository preferencesRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdatePreferencesCommand>
{
    public async Task<Result> Handle(
        UpdatePreferencesCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        UserNotificationPreferences preferences = await preferencesRepository.GetOrCreateDefaultAsync(
            userId,
            cancellationToken);

        // Merge: any field the client omitted (null) keeps its current value, so
        // toggling one switch never clobbers the others.
        bool inAppEnabled = request.InAppEnabled ?? preferences.InAppEnabled;
        bool emailEnabled = request.EmailEnabled ?? preferences.EmailEnabled;
        bool pushEnabled = request.PushEnabled ?? preferences.PushEnabled;
        bool smsEnabled = request.SmsEnabled ?? preferences.SmsEnabled;
        bool emailDigestEnabled = request.EmailDigestEnabled ?? preferences.EmailDigestEnabled;
        TimeOnly? emailDigestTime = request.EmailDigestTime ?? preferences.EmailDigestTime;
        bool quietHoursEnabled = request.QuietHoursEnabled ?? preferences.QuietHoursEnabled;
        TimeOnly? quietHoursStart = request.QuietHoursStart ?? preferences.QuietHoursStart;
        TimeOnly? quietHoursEnd = request.QuietHoursEnd ?? preferences.QuietHoursEnd;
        string? quietHoursTimezone = request.QuietHoursTimezone ?? preferences.QuietHoursTimezone;

        // Validate timezone if provided
        if (quietHoursEnabled && !string.IsNullOrEmpty(quietHoursTimezone))
        {
            try
            {
                TimeZoneInfo.FindSystemTimeZoneById(quietHoursTimezone);
            }
            catch (TimeZoneNotFoundException)
            {
                return Result.Failure(NotificationErrors.InvalidTimezone(quietHoursTimezone));
            }
        }

        // When quiet hours are switched on without an explicit window, default to
        // a reasonable overnight span (22:00–07:00) so a single toggle works.
        if (quietHoursEnabled)
        {
            quietHoursStart ??= new TimeOnly(22, 0);
            quietHoursEnd ??= new TimeOnly(7, 0);
        }

        // Parse digest frequency
        DigestFrequency digestFrequency = preferences.EmailDigestFrequency;
        if (request.EmailDigestFrequency is not null &&
            !Enum.TryParse(request.EmailDigestFrequency, true, out digestFrequency))
        {
            digestFrequency = DigestFrequency.Daily;
        }

        // Update preferences
        preferences.UpdateChannelSettings(
            inAppEnabled,
            emailEnabled,
            pushEnabled,
            smsEnabled);

        preferences.UpdateDigestSettings(
            emailDigestEnabled,
            digestFrequency,
            emailDigestTime);

        preferences.UpdateQuietHours(
            quietHoursEnabled,
            quietHoursStart,
            quietHoursEnd,
            quietHoursTimezone);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
