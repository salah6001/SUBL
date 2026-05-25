using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Devices.GetMyDevices;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class GetMyDevices : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("devices", async (
            bool? includeRevoked,
            IQueryHandler<GetMyDevicesQuery, List<DeviceResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetMyDevicesQuery(includeRevoked ?? false);

            Result<List<DeviceResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("List all desktop agent devices registered by the current user");
    }
}
