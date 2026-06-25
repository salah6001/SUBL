using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Application.Admin.GetAlerts;
using Domain.Alerts;
using Domain.Common;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class GetAlerts : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("admin/alerts", async (
            AlertStatus? status,
            Department? department,
            AlertSeverity? severity,
            int? limit,
            IQueryHandler<GetAlertsQuery, List<AlertResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAlertsQuery(status, department, severity, limit ?? 100);

            Result<List<AlertResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("List admin stress alerts (super admin)");
    }
}
