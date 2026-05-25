using FluentValidation;

namespace Application.StressDetection.Sessions.StartSession;

internal sealed class StartSessionCommandValidator : AbstractValidator<StartSessionCommand>
{
    public StartSessionCommandValidator()
    {
        RuleFor(c => c.DeviceId).NotEmpty();
        RuleFor(c => c.Notes).MaximumLength(500);
    }
}
