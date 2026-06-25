using Application.Abstractions.Messaging;
using Application.StressDetection.Devices.AutoClaimDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class AutoClaimDevice : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("devices/auto-claim", async (
            ICommandHandler<AutoClaimDeviceCommand, AutoClaimDeviceResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new AutoClaimDeviceCommand();

            Result<AutoClaimDeviceResponse> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("Auto-claim the freshest online unclaimed device for the current user (called on login)");
    }
}
