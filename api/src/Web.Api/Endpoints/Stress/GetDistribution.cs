using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.GetDistribution;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

internal sealed class GetDistribution : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress/distribution", async (
            DateTime? from,
            DateTime? to,
            IQueryHandler<GetDistributionQuery, StressDistributionResponse> handler,
            CancellationToken cancellationToken) =>
        {
            DateTime end = to ?? DateTime.UtcNow;
            DateTime start = from ?? end.AddDays(-30);
            var query = new GetDistributionQuery(start, end);

            Result<StressDistributionResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary("Get the distribution of stress readings across levels for charting");
    }
}
