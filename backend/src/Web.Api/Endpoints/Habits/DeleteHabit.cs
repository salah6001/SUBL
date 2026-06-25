using Application.Abstractions.Messaging;
using Application.Habits.DeleteHabit;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Habits;

internal sealed class DeleteHabit : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("habits/{habitId:guid}", async (
            Guid habitId,
            ICommandHandler<DeleteHabitCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteHabitCommand(habitId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Habits)
        .RequireAuthorization()
        .WithSummary("Delete one of the current user's habits");
    }
}
