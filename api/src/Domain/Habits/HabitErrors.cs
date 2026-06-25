using SharedKernel;

namespace Domain.Habits;

public static class HabitErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "Habit.NotFound",
        $"The habit with Id = '{id}' was not found");
}
