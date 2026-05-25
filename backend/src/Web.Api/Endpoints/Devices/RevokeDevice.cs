using Application.Abstractions.Messaging;
using Application.StressDetection.Devices.RevokeDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class RevokeDevice : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("devices/{deviceId:guid}", async (
            Guid deviceId,
            ICommandHandler<RevokeDeviceCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new RevokeDeviceCommand(deviceId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("Revoke a registered desktop agent device");
    }
}
