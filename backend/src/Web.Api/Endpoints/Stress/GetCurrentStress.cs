using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.GetCurrentStress;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

internal sealed class GetCurrentStress : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress/current", async (
            IQueryHandler<GetCurrentStressQuery, CurrentStressResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<CurrentStressResponse> result = await handler.Handle(
                new GetCurrentStressQuery(),
                cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary("Get the current user's most recent stress reading");
    }
}
