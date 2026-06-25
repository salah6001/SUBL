using Application.Abstractions.Messaging;
using Application.StressDetection.Sessions.EndSession;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class EndSession : IEndpoint
{
    public sealed record Request(string? Reason);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("stress-sessions/{sessionId:guid}/end", async (
            Guid sessionId,
            Request? request,
            ICommandHandler<EndSessionCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new EndSessionCommand(sessionId, request?.Reason);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("End an active stress monitoring session");
    }
}
