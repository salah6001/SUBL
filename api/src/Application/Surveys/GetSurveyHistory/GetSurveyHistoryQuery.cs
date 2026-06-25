using Application.Abstractions.Messaging;
using Application.Surveys.Common;

namespace Application.Surveys.GetSurveyHistory;

/// <summary>
/// Returns the current user's past survey results (most recent first).
/// </summary>
public sealed record GetSurveyHistoryQuery : IQuery<List<SurveyResultResponse>>;
