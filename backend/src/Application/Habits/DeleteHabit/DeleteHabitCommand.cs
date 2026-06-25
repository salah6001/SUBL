using Application.Abstractions.Messaging;

namespace Application.Habits.DeleteHabit;

public sealed record DeleteHabitCommand(Guid HabitId) : ICommand;
