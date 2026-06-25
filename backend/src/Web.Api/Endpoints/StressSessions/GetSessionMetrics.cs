using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Sessions.GetSessionMetrics;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class GetSessionMetrics : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress-sessions/{sessionId:guid}/metrics", async (
            Guid sessionId,
            IQueryHandler<GetSessionMetricsQuery, SessionMetricsResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSessionMetricsQuery(sessionId);

            Result<SessionMetricsResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Get aggregated metrics and level distribution for a stress session");
    }
}
