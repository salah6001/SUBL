using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.GetTrends;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

internal sealed class GetTrends : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress/trends", async (
            DateTime? from,
            DateTime? to,
            string? granularity,
            Guid? userId,
            IQueryHandler<GetTrendsQuery, List<StressTrendPoint>> handler,
            CancellationToken cancellationToken) =>
        {
            DateTime end = to ?? DateTime.UtcNow;
            DateTime start = from ?? end.AddDays(-30);
            var query = new GetTrendsQuery(
                start,
                end,
                string.IsNullOrWhiteSpace(granularity) ? "Hour" : granularity,
                userId);

            Result<List<StressTrendPoint>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary("Get time-bucketed stress trends for charting (Minute/Hour/Day/Week). " +
            "Super admins may pass userId to view another user's trends.");
    }
}
