using Application.Abstractions.Messaging;
using Application.StressDetection.Devices.PingDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class PingDevice : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("devices/{deviceId:guid}/ping", async (
            Guid deviceId,
            HttpContext httpContext,
            ICommandHandler<PingDeviceCommand> handler,
            CancellationToken cancellationToken) =>
        {
            string? ip = httpContext.Connection.RemoteIpAddress?.ToString();

            var command = new PingDeviceCommand(deviceId, ip);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("Heartbeat: refresh the device's last-seen timestamp so it stays online");
    }
}
