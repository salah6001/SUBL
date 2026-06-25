using FluentValidation;

namespace Application.StressDetection.Stress.GetDepartmentStress;

internal sealed class GetDepartmentStressQueryValidator : AbstractValidator<GetDepartmentStressQuery>
{
    public GetDepartmentStressQueryValidator()
    {
        RuleFor(q => q.From)
            .LessThan(q => q.To)
            .WithMessage("From must be earlier than To");
    }
}
