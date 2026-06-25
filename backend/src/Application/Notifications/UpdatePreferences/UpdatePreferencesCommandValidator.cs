using FluentValidation;

namespace Application.Notifications.UpdatePreferences;

public sealed class UpdatePreferencesCommandValidator : AbstractValidator<UpdatePreferencesCommand>
{
    private static readonly string[] ValidDigestFrequencies = ["Immediate", "Hourly", "Daily", "Weekly"];

    public UpdatePreferencesCommandValidator()
    {
        RuleFor(x => x.EmailDigestFrequency)
            .Must(f => string.IsNullOrEmpty(f) || ValidDigestFrequencies.Contains(f, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Digest frequency must be one of: {string.Join(", ", ValidDigestFrequencies)}");

        RuleFor(x => x.QuietHoursTimezone)
            .MaximumLength(100).WithMessage("Timezone must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.QuietHoursTimezone));

        // Note: start/end are no longer required here. With partial updates a
        // client may flip quiet hours on with a single toggle; the handler fills
        // in a sensible default window (and its own existing values) when needed.
    }
}
