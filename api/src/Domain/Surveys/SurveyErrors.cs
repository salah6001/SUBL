using SharedKernel;

namespace Domain.Surveys;

public static class SurveyErrors
{
    public static readonly Error NoAnswers = Error.Validation(
        "Survey.NoAnswers",
        "At least one answer is required.");

    public static readonly Error UnknownQuestions = Error.Validation(
        "Survey.UnknownQuestions",
        "One or more answers reference an unknown or inactive question.");

    public static readonly Error MissingAnswers = Error.Validation(
        "Survey.MissingAnswers",
        "All active questions must be answered.");

    public static Error ResponseNotFound(Guid id) => Error.NotFound(
        "Survey.ResponseNotFound",
        $"The survey response with Id = '{id}' was not found");
}
