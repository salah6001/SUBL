using Application.Abstractions.Messaging;
using Application.Habits.Common;

namespace Application.Habits.GetHabits;

/// <summary>
/// Returns the current user's habits with computed streak and today's status.
/// </summary>
public sealed record GetHabitsQuery(
    bool IncludeInactive = false) : IQuery<List<HabitResponse>>;
