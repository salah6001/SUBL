using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Sessions.GetActiveSession;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class GetActiveSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress-sessions/active", async (
            IQueryHandler<GetActiveSessionQuery, SessionResponse?> handler,
            CancellationToken cancellationToken) =>
        {
            Result<SessionResponse?> result = await handler.Handle(
                new GetActiveSessionQuery(),
                cancellationToken);

            return result.Match(
                session => session is null ? Results.NoContent() : Results.Ok(session),
                CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Get the current user's active stress monitoring session, if any");
    }
}
