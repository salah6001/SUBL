using FluentValidation;

namespace Application.StressDetection.Stress.GetDistribution;

internal sealed class GetDistributionQueryValidator : AbstractValidator<GetDistributionQuery>
{
    public GetDistributionQueryValidator()
    {
        RuleFor(q => q.From)
            .LessThan(q => q.To)
            .WithMessage("From must be earlier than To");
    }
}
