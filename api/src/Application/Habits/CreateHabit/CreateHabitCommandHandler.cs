using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Habits;
using SharedKernel;

namespace Application.Habits.CreateHabit;

internal sealed class CreateHabitCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<CreateHabitCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateHabitCommand request,
        CancellationToken cancellationToken)
    {
        var habit = Habit.Create(
            currentUserService.UserId,
            request.Label,
            request.Category,
            request.Icon);

        context.Habits.Add(habit);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(habit.Id);
    }
}
