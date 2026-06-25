namespace Application.Habits.Common;

/// <summary>
/// Computes the current streak (consecutive completed days) for a habit from
/// its set of completed dates.
/// </summary>
internal static class HabitStreakCalculator
{
    /// <summary>
    /// Counts consecutive completed days ending today (or yesterday, if today
    /// is not yet completed but the run is otherwise unbroken).
    /// </summary>
    public static int Calculate(IReadOnlySet<DateOnly> completedDates, DateOnly today)
    {
        if (completedDates.Count == 0)
        {
            return 0;
        }

        // Anchor the run at today if completed, otherwise at yesterday so an
        // in-progress day doesn't reset an otherwise unbroken streak.
        DateOnly cursor = completedDates.Contains(today)
            ? today
            : today.AddDays(-1);

        int streak = 0;
        while (completedDates.Contains(cursor))
        {
            streak++;
            cursor = cursor.AddDays(-1);
        }

        return streak;
    }
}
