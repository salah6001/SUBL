using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Habits;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Habits.ToggleHabitCompletion;

internal sealed class ToggleHabitCompletionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<ToggleHabitCompletionCommand, bool>
{
    public async Task<Result<bool>> Handle(
        ToggleHabitCompletionCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        Habit? habit = await context.Habits
            .FirstOrDefaultAsync(
                h => h.Id == request.HabitId && h.UserId == userId,
                cancellationToken);

        if (habit is null)
        {
            return Result.Failure<bool>(HabitErrors.NotFound(request.HabitId));
        }

        DateOnly date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        HabitCompletion? existing = await context.HabitCompletions
            .FirstOrDefaultAsync(
                c => c.HabitId == habit.Id && c.Date == date,
                cancellationToken);

        bool completed;
        if (existing is null)
        {
            context.HabitCompletions.Add(HabitCompletion.Create(habit.Id, userId, date));
            completed = true;
        }
        else
        {
            context.HabitCompletions.Remove(existing);
            completed = false;
        }

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(completed);
    }
}
