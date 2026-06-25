using Application.Abstractions.Messaging;
using Application.StressDetection.Devices.ClaimDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class ClaimDevice : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("devices/{deviceId:guid}/claim", async (
            Guid deviceId,
            ICommandHandler<ClaimDeviceCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ClaimDeviceCommand(deviceId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("Claim a device so its keystroke data feeds the current user's dashboard");
    }
}
