using Domain.Surveys;
using FluentValidation;

namespace Application.Surveys.SubmitSurveyResponse;

internal sealed class SubmitSurveyResponseCommandValidator : AbstractValidator<SubmitSurveyResponseCommand>
{
    public SubmitSurveyResponseCommandValidator()
    {
        RuleFor(c => c.Answers)
            .NotEmpty();

        RuleForEach(c => c.Answers).ChildRules(answer =>
        {
            answer.RuleFor(a => a.QuestionId)
                .NotEmpty();

            answer.RuleFor(a => a.Value)
                .InclusiveBetween(0, SurveyResponse.MaxAnswerValue);
        });
    }
}
