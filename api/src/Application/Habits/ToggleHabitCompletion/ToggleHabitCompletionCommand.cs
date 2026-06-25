using Application.Abstractions.Messaging;

namespace Application.Habits.ToggleHabitCompletion;

/// <summary>
/// Toggles completion of a habit for a given day (defaults to today).
/// Returns the resulting completed state.
/// </summary>
public sealed record ToggleHabitCompletionCommand(
    Guid HabitId,
    DateOnly? Date = null) : ICommand<bool>;
