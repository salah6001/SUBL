using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Habits;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Habits.UpdateHabit;

internal sealed class UpdateHabitCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdateHabitCommand>
{
    public async Task<Result> Handle(
        UpdateHabitCommand request,
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

        habit.Update(request.Label, request.Category, request.Icon);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
