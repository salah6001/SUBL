using Application.Abstractions.Messaging;
using Application.Admin.GetUserStressTrends;
using Application.StressDetection.Common;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class GetUserStressTrends : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("admin/users/{userId:guid}/stress-trends", async (
            Guid userId,
            DateTime? from,
            DateTime? to,
            string? granularity,
            IQueryHandler<GetUserStressTrendsQuery, List<StressTrendPoint>> handler,
            CancellationToken cancellationToken) =>
        {
            DateTime end = to ?? DateTime.UtcNow;
            DateTime start = from ?? end.AddDays(-30);
            var query = new GetUserStressTrendsQuery(userId, start, end, granularity ?? "Day");
            Result<List<StressTrendPoint>> result = await handler.Handle(query, cancellationToken);
            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Get stress trends for a specific user (super admin only)");
    }
}
