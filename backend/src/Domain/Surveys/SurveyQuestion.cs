using SharedKernel;

namespace Domain.Surveys;

/// <summary>
/// A system-managed stress assessment question (PSS-style, answered 0-4).
/// </summary>
public sealed class SurveyQuestion : Entity
{
    public Guid Id { get; private set; }

    public string Text { get; private set; } = string.Empty;

    /// <summary>
    /// Grouping category, e.g. "Control", "Anxiety".
    /// </summary>
    public string Category { get; private set; } = string.Empty;

    public int Order { get; private set; }

    public bool IsActive { get; private set; }

    private SurveyQuestion()
    {
    }

    public SurveyQuestion(Guid id, string text, string category, int order, bool isActive)
    {
        Id = id;
        Text = text;
        Category = category;
        Order = order;
        IsActive = isActive;
    }
}
