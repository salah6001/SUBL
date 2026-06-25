using Application.Abstractions.Messaging;
using Application.Surveys.Common;

namespace Application.Surveys.SubmitSurveyResponse;

public sealed record SurveyAnswerInput(Guid QuestionId, int Value);

/// <summary>
/// Submits a completed survey. Every active question must be answered (0-4).
/// </summary>
public sealed record SubmitSurveyResponseCommand(
    IReadOnlyList<SurveyAnswerInput> Answers) : ICommand<SurveyResultResponse>;
