using Application.Abstractions.Messaging;
using Application.Surveys.Common;

namespace Application.Surveys.GetSurveyQuestions;

public sealed record GetSurveyQuestionsQuery : IQuery<List<SurveyQuestionResponse>>;
