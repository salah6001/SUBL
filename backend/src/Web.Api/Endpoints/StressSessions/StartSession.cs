using Application.Abstractions.Messaging;
using Application.StressDetection.Sessions.StartSession;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class StartSession : IEndpoint
{
    public sealed record Request(Guid DeviceId, string? Notes);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("stress-sessions/start", async (
            Request request,
            ICommandHandler<StartSessionCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new StartSessionCommand(request.DeviceId, request.Notes);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                id => Results.Created($"/stress-sessions/{id}", new { id }),
                CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Start a new stress monitoring session");
    }
}
