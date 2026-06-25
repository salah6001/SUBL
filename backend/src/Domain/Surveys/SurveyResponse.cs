using SharedKernel;

namespace Domain.Surveys;

/// <summary>
/// A completed stress assessment: the user's answers plus the computed score.
/// </summary>
public sealed class SurveyResponse : Entity
{
    /// <summary>Maximum value for a single answer (0-4 scale).</summary>
    public const int MaxAnswerValue = 4;

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public DateTime SubmittedAt { get; private set; }

    public int TotalScore { get; private set; }

    public SurveyStressLevel Level { get; private set; }

    private readonly List<SurveyAnswer> _answers = [];
    public IReadOnlyList<SurveyAnswer> Answers => _answers;

    private SurveyResponse()
    {
    }

    public static SurveyResponse Create(
        Guid userId,
        IReadOnlyList<(Guid QuestionId, int Value)> answers)
    {
        var response = new SurveyResponse
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubmittedAt = DateTime.UtcNow,
            TotalScore = answers.Sum(a => a.Value)
        };

        foreach ((Guid questionId, int value) in answers)
        {
            response._answers.Add(new SurveyAnswer(response.Id, questionId, value));
        }

        response.Level = CalculateLevel(response.TotalScore, answers.Count);

        return response;
    }

    private static SurveyStressLevel CalculateLevel(int totalScore, int questionCount)
    {
        if (questionCount == 0)
        {
            return SurveyStressLevel.Low;
        }

        double pct = (double)totalScore / (questionCount * MaxAnswerValue);

        return pct switch
        {
            < 0.35 => SurveyStressLevel.Low,
            < 0.70 => SurveyStressLevel.Moderate,
            _ => SurveyStressLevel.High
        };
    }
}
