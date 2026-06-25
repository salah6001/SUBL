using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.GetStressSummary;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

internal sealed class GetSummary : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress/summary", async (
            DateTime? from,
            DateTime? to,
            IQueryHandler<GetStressSummaryQuery, StressSummaryResponse> handler,
            CancellationToken cancellationToken) =>
        {
            DateTime end = to ?? DateTime.UtcNow;
            DateTime start = from ?? end.AddDays(-30);
            var query = new GetStressSummaryQuery(start, end);
            Result<StressSummaryResponse> result = await handler.Handle(query, cancellationToken);
            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary("Aggregated stress KPIs for a date range (avg, peak, dominant emotion, session count).");
    }
}
