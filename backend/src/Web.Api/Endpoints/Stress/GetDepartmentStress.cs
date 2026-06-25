using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.GetDepartmentStress;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

internal sealed class GetDepartmentStress : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("stress/departments", async (
            DateTime? from,
            DateTime? to,
            IQueryHandler<GetDepartmentStressQuery, DepartmentStressResponse> handler,
            CancellationToken cancellationToken) =>
        {
            DateTime end = to ?? DateTime.UtcNow;
            DateTime start = from ?? end.AddDays(-30);
            var query = new GetDepartmentStressQuery(start, end);

            Result<DepartmentStressResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary("Get stress aggregated per department (super admin analytics)");
    }
}
