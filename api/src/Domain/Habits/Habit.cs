using SharedKernel;

namespace Domain.Habits;

/// <summary>
/// A user-created wellness habit tracked daily for streaks.
/// </summary>
public sealed class Habit : Entity
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The user who owns this habit.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// Display label, e.g. "5-Min Box Breathing".
    /// </summary>
    public string Label { get; private set; } = string.Empty;

    public HabitCategory Category { get; private set; }

    /// <summary>
    /// Icon name used by the client (e.g. "Wind").
    /// </summary>
    public string? Icon { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime CreatedAt { get; private set; }

    // Navigation
    public List<HabitCompletion> Completions { get; private set; } = [];

    private Habit()
    {
    }

    public static Habit Create(
        Guid userId,
        string label,
        HabitCategory category,
        string? icon)
    {
        return new Habit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Label = label,
            Category = category,
            Icon = icon,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string label, HabitCategory category, string? icon)
    {
        Label = label;
        Category = category;
        Icon = icon;
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;
}
