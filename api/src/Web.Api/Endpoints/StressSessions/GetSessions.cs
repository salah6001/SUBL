using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Sessions.GetSessions;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.StressSessions;

internal sealed class GetSessions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress-sessions", async (
            int? page,
            int? pageSize,
            DateTime? from,
            DateTime? to,
            IQueryHandler<GetSessionsQuery, PagedResult<SessionResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSessionsQuery(
                page ?? 1,
                pageSize ?? 20,
                from,
                to);

            Result<PagedResult<SessionResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.StressSessions)
        .RequireAuthorization()
        .WithSummary("Get the current user's session history (paginated)");
    }
}
