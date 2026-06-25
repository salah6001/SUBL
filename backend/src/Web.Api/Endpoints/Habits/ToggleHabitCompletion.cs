using Application.Abstractions.Messaging;
using Application.Habits.ToggleHabitCompletion;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Habits;

internal sealed class ToggleHabitCompletion : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("habits/{habitId:guid}/toggle", async (
            Guid habitId,
            ICommandHandler<ToggleHabitCompletionCommand, bool> handler,
            CancellationToken cancellationToken) =>
        {
            // Toggles today's completion (server uses UTC "today").
            var command = new ToggleHabitCompletionCommand(habitId);

            Result<bool> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                completed => Results.Ok(new { completed }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Habits)
        .RequireAuthorization()
        .WithSummary("Toggle today's completion for a habit; returns the new completed state");
    }
}
