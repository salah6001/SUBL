using FluentValidation;

namespace Application.StressDetection.Stress.GetTrends;

internal sealed class GetTrendsQueryValidator : AbstractValidator<GetTrendsQuery>
{
    private static readonly string[] AllowedGranularities = ["Minute", "Hour", "Day", "Week"];

    public GetTrendsQueryValidator()
    {
        RuleFor(q => q.From)
            .LessThan(q => q.To)
            .WithMessage("From must be earlier than To");

        RuleFor(q => q.Granularity)
            .Must(g => AllowedGranularities.Contains(g, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Granularity must be one of: {string.Join(", ", AllowedGranularities)}");
    }
}
