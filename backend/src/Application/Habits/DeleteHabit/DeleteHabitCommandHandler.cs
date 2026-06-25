using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Habits;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Habits.DeleteHabit;

internal sealed class DeleteHabitCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<DeleteHabitCommand>
{
    public async Task<Result> Handle(
        DeleteHabitCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        Habit? habit = await context.Habits
            .FirstOrDefaultAsync(
                h => h.Id == request.HabitId && h.UserId == userId,
                cancellationToken);

        if (habit is null)
        {
            return Result.Failure(HabitErrors.NotFound(request.HabitId));
        }

        // Hard delete; completions cascade via the FK relationship.
        context.Habits.Remove(habit);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
