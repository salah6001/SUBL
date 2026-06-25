using FluentValidation;

namespace Application.StressDetection.Stress.SubmitMetrics;

/// <summary>
/// Validates the 6 keyboard features submitted by the desktop agent.
/// Constraints mirror the Python ML <c>FeatureInput</c> Pydantic model
/// (<c>gt=0</c> / <c>ge=0</c>) so any payload that passes here will pass
/// downstream validation as well.
/// </summary>
internal sealed class SubmitMetricsCommandValidator : AbstractValidator<SubmitMetricsCommand>
{
    public SubmitMetricsCommandValidator()
    {
        RuleFor(c => c.SessionId).NotEmpty();

        RuleFor(c => c.MeanDwell)
            .GreaterThan(0)
            .WithMessage("meanDwell must be greater than 0");

        RuleFor(c => c.MedianFlight)
            .GreaterThan(0)
            .WithMessage("medianFlight must be greater than 0");

        RuleFor(c => c.CvFlight)
            .GreaterThanOrEqualTo(0)
            .WithMessage("cvFlight must be >= 0");

        RuleFor(c => c.MeanDelFreq)
            .GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(100)
            .WithMessage("meanDelFreq must be between 0 and 100");

        RuleFor(c => c.MeanTotTime)
            .GreaterThan(0)
            .WithMessage("meanTotTime must be greater than 0");

        RuleFor(c => c.NKeys)
            .GreaterThan(0)
            .WithMessage("nKeys must be greater than 0");

        RuleFor(c => c.DeleteCount)
            .GreaterThanOrEqualTo(0)
            .When(c => c.DeleteCount.HasValue)
            .WithMessage("deleteCount must be >= 0");
    }
}
