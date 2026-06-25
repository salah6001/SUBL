using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Habits.Common;
using Domain.Habits;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Habits.GetHabits;

internal sealed class GetHabitsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetHabitsQuery, List<HabitResponse>>
{
    public async Task<Result<List<HabitResponse>>> Handle(
        GetHabitsQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        List<Habit> habits = await context.Habits
            .AsNoTracking()
            .Include(h => h.Completions)
            .Where(h => h.UserId == userId && (request.IncludeInactive || h.IsActive))
            .OrderBy(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var response = habits
            .Select(h =>
            {
                var completedDates = h.Completions
                    .Select(c => c.Date)
                    .ToHashSet();

                return new HabitResponse(
                    h.Id,
                    h.Label,
                    h.Category.ToString(),
                    h.Icon,
                    h.IsActive,
                    HabitStreakCalculator.Calculate(completedDates, today),
                    completedDates.Contains(today),
                    h.CreatedAt);
            })
            .ToList();

        return Result.Success(response);
    }
}
