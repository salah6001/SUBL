using Application.Abstractions.Messaging;
using Domain.Habits;

namespace Application.Habits.UpdateHabit;

public sealed record UpdateHabitCommand(
    Guid HabitId,
    string Label,
    HabitCategory Category,
    string? Icon) : ICommand;
