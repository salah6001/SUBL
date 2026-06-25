using Application.Abstractions.Messaging;
using Domain.Habits;

namespace Application.Habits.CreateHabit;

public sealed record CreateHabitCommand(
    string Label,
    HabitCategory Category,
    string? Icon) : ICommand<Guid>;
