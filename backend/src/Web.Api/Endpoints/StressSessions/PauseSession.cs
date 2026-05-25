using Application.Abstractions.Messaging;
using Application.StressDetection.Sessions.PauseSession;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class PauseSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("stress-sessions/{sessionId:guid}/pause", async (
            Guid sessionId,
            ICommandHandler<PauseSessionCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new PauseSessionCommand(sessionId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Pause a running stress monitoring session");
    }
}
