using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Devices.GetClaimableDevices;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class GetClaimableDevices : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("devices/claimable", async (
            IQueryHandler<GetClaimableDevicesQuery, List<ClaimableDeviceResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            Result<List<ClaimableDeviceResponse>> result =
                await handler.Handle(new GetClaimableDevicesQuery(), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("List active devices the current user can claim");
    }
}
