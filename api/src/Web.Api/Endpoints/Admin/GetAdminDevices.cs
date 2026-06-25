using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Application.Admin.GetAdminDevices;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class GetAdminDevices : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("admin/devices", async (
            bool? includeRevoked,
            IQueryHandler<GetAdminDevicesQuery, List<AdminDeviceResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetAdminDevicesQuery(includeRevoked ?? true);
            Result<List<AdminDeviceResponse>> result = await handler.Handle(query, cancellationToken);
            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("List all registered devices across all users (super admin)");
    }
}
