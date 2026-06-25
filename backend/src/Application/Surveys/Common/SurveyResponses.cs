namespace Application.Surveys.Common;

/// <summary>
/// An active survey question shown to the user.
/// </summary>
public sealed record SurveyQuestionResponse(
    Guid Id,
    string Text,
    string Category,
    int Order);

/// <summary>
/// Result of a submitted (or past) survey response.
/// </summary>
public sealed record SurveyResultResponse(
    Guid Id,
    DateTime SubmittedAt,
    int TotalScore,
    int MaxScore,
    string Level);
