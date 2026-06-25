using Application.Abstractions.Messaging;
using Application.Habits.CreateHabit;
using Domain.Habits;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Habits;

internal sealed class CreateHabit : IEndpoint
{
    public sealed record Request(string Label, HabitCategory Category, string? Icon);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("habits", async (
            Request request,
            ICommandHandler<CreateHabitCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateHabitCommand(request.Label, request.Category, request.Icon);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                id => Results.Created($"/habits/{id}", new { id }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Habits)
        .RequireAuthorization()
        .WithSummary("Create a new habit for the current user");
    }
}
