using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Privacy.DeleteMyData;

internal sealed class DeleteMyDataCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<DeleteMyDataCommand>
{
    public async Task<Result> Handle(
        DeleteMyDataCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        // Delete in FK-safe order (dependents first). Each ExecuteDeleteAsync
        // runs as its own statement.
        await context.StressReadings
            .Where(r => r.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.KeyboardMetrics
            .Where(m => context.StressSessions
                .Any(s => s.Id == m.SessionId && s.UserId == userId))
            .ExecuteDeleteAsync(cancellationToken);

        await context.StressSessions
            .Where(s => s.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.Devices
            .Where(d => d.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.HabitCompletions
            .Where(c => c.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.Habits
            .Where(h => h.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.Notifications
            .Where(n => n.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        return Result.Success();
    }
}
