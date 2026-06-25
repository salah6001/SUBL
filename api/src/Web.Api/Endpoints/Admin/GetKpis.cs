using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Application.Admin.GetKpis;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class GetKpis : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("admin/kpis", async (
            DateTime? from,
            DateTime? to,
            IQueryHandler<GetKpisQuery, AdminKpisResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetKpisQuery(from, to);

            Result<AdminKpisResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Get organization-wide wellbeing KPIs (super admin)");
    }
}
