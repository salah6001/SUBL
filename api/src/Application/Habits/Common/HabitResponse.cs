namespace Application.Habits.Common;

/// <summary>
/// Response DTO for a habit, including the computed streak and whether it has
/// been completed today.
/// </summary>
public sealed record HabitResponse(
    Guid Id,
    string Label,
    string Category,
    string? Icon,
    bool IsActive,
    int Streak,
    bool CompletedToday,
    DateTime CreatedAt);
