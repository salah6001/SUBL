using Application.Abstractions.Messaging;
using Application.AuditLogs.Common;
using Application.AuditLogs.GetActivityFeed;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class GetActivityFeed : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("admin/activity-feed", async (
            int? limit,
            IQueryHandler<GetActivityFeedQuery, List<AuditLogListItemResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetActivityFeedQuery(limit ?? 50);

            Result<List<AuditLogListItemResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Get the most recent audit-log entries as an admin activity feed");
    }
}
