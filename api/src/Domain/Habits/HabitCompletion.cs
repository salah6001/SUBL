using SharedKernel;

namespace Domain.Habits;

/// <summary>
/// Marks a habit as completed on a specific calendar day.
/// The existence of a row means the habit was completed that day.
/// </summary>
public sealed class HabitCompletion : Entity
{
    public Guid Id { get; private set; }

    public Guid HabitId { get; private set; }

    /// <summary>
    /// Denormalized owner for fast per-user queries.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// The calendar day (UTC) this completion is for.
    /// </summary>
    public DateOnly Date { get; private set; }

    public DateTime CompletedAt { get; private set; }

    // Navigation
    public Habit? Habit { get; init; }

    private HabitCompletion()
    {
    }

    public static HabitCompletion Create(Guid habitId, Guid userId, DateOnly date)
    {
        return new HabitCompletion
        {
            Id = Guid.NewGuid(),
            HabitId = habitId,
            UserId = userId,
            Date = date,
            CompletedAt = DateTime.UtcNow
        };
    }
}
