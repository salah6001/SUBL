using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.GetReadings;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

internal sealed class GetReadings : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress/readings", async (
            int? page,
            int? pageSize,
            DateTime? from,
            DateTime? to,
            Guid? sessionId,
            IQueryHandler<GetReadingsQuery, PagedResult<StressReadingResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetReadingsQuery(
                page ?? 1,
                pageSize ?? 50,
                from,
                to,
                sessionId);

            Result<PagedResult<StressReadingResponse>> result = await handler.Handle(
                query,
                cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary("Get paginated stress readings for the current user");
    }
}
