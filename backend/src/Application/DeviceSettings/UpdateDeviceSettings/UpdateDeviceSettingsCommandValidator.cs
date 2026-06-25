using FluentValidation;

namespace Application.DeviceSettings.UpdateDeviceSettings;

internal sealed class UpdateDeviceSettingsCommandValidator : AbstractValidator<UpdateDeviceSettingsCommand>
{
    public UpdateDeviceSettingsCommandValidator()
    {
        RuleFor(c => c.Language)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(c => c.Timezone)
            .NotEmpty()
            .MaximumLength(60);

        RuleFor(c => c.DateFormat)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(c => c.StressThreshold)
            .InclusiveBetween(0, 100);

        RuleFor(c => c.MonitoringInterval)
            .IsInEnum();
    }
}
