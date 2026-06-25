using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.DeleteMyData;

internal sealed class DeleteMyDataCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser)
    : ICommandHandler<DeleteMyDataCommand>
{
    public async Task<Result> Handle(DeleteMyDataCommand command, CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;

        // Delete children before parents to respect FK constraints. ExecuteDelete
        // runs set-based DELETEs straight against the DB (no tracking needed).

        // Stress: metrics + readings (by session) → sessions
        IQueryable<Guid> sessionIds = context.StressSessions
            .Where(s => s.UserId == userId)
            .Select(s => s.Id);

        await context.KeyboardMetrics
            .Where(m => sessionIds.Contains(m.SessionId))
            .ExecuteDeleteAsync(cancellationToken);

        await context.StressReadings
            .Where(r => r.UserId == userId || sessionIds.Contains(r.SessionId))
            .ExecuteDeleteAsync(cancellationToken);

        await context.StressSessions
            .Where(s => s.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.StressAlerts
            .Where(a => a.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        // Surveys: answers (by response) → responses
        IQueryable<Guid> responseIds = context.SurveyResponses
            .Where(r => r.UserId == userId)
            .Select(r => r.Id);

        await context.SurveyAnswers
            .Where(a => responseIds.Contains(a.ResponseId))
            .ExecuteDeleteAsync(cancellationToken);

        await context.SurveyResponses
            .Where(r => r.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        // Habits: completions → habits
        await context.HabitCompletions
            .Where(c => c.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await context.Habits
            .Where(h => h.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        // Notifications: deliveries (by notification) → notifications
        IQueryable<Guid> notificationIds = context.Notifications
            .Where(n => n.UserId == userId)
            .Select(n => n.Id);

        await context.NotificationDeliveries
            .Where(d => notificationIds.Contains(d.NotificationId))
            .ExecuteDeleteAsync(cancellationToken);

        await context.Notifications
            .Where(n => n.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        return Result.Success();
    }
}
