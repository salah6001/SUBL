using FluentValidation;

namespace Application.StressDetection.Devices.RegisterDevice;

internal sealed class RegisterDeviceCommandValidator : AbstractValidator<RegisterDeviceCommand>
{
    public RegisterDeviceCommandValidator()
    {
        RuleFor(c => c.DeviceName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(c => c.DeviceFingerprint)
            .NotEmpty()
            .MaximumLength(256);

        RuleFor(c => c.Platform)
            .NotEmpty()
            .Must(p => Enum.TryParse<Domain.StressDetection.DevicePlatform>(p, true, out _))
            .WithMessage("Platform must be one of: Windows, MacOS, Linux");

        RuleFor(c => c.OsVersion)
            .MaximumLength(100);

        RuleFor(c => c.AgentVersion)
            .MaximumLength(50);
    }
}
