using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Sessions.GetSessionById;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class GetSessionById : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress-sessions/{sessionId:guid}", async (
            Guid sessionId,
            IQueryHandler<GetSessionByIdQuery, SessionDetailResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSessionByIdQuery(sessionId);

            Result<SessionDetailResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Get a specific stress session including all its readings");
    }
}
