using Application.Abstractions.Messaging;
using Application.StressDetection.Sessions.ResumeSession;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class ResumeSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("stress-sessions/{sessionId:guid}/resume", async (
            Guid sessionId,
            ICommandHandler<ResumeSessionCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ResumeSessionCommand(sessionId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Resume a paused stress monitoring session");
    }
}
