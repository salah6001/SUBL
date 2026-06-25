using Application.Abstractions.Messaging;
using Application.Admin.AssignDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class AssignDevice : IEndpoint
{
    public sealed record Request(Guid? UserId);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("admin/devices/{deviceId:guid}/assign", async (
            Guid deviceId,
            Request request,
            ICommandHandler<AssignDeviceCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new AssignDeviceCommand(deviceId, request.UserId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Assign (or release) which user a device's keystroke data feeds (super admin)");
    }
}
