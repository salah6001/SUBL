using SharedKernel;

namespace Domain.Surveys;

/// <summary>
/// A single answer (0-4) to a survey question within a response.
/// </summary>
public sealed class SurveyAnswer : Entity
{
    public Guid Id { get; private set; }

    public Guid ResponseId { get; private set; }

    public Guid QuestionId { get; private set; }

    /// <summary>
    /// Answer value on the 0-4 scale.
    /// </summary>
    public int Value { get; private set; }

    private SurveyAnswer()
    {
    }

    internal SurveyAnswer(Guid responseId, Guid questionId, int value)
    {
        Id = Guid.NewGuid();
        ResponseId = responseId;
        QuestionId = questionId;
        Value = value;
    }
}
