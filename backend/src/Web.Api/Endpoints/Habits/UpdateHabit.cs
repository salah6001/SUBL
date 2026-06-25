using Application.Abstractions.Messaging;
using Application.Habits.UpdateHabit;
using Domain.Habits;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Habits;

internal sealed class UpdateHabit : IEndpoint
{
    public sealed record Request(string Label, HabitCategory Category, string? Icon);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("habits/{habitId:guid}", async (
            Guid habitId,
            Request request,
            ICommandHandler<UpdateHabitCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateHabitCommand(habitId, request.Label, request.Category, request.Icon);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Habits)
        .RequireAuthorization()
        .WithSummary("Update one of the current user's habits");
    }
}
