using Application.Abstractions.Messaging;
using Application.Admin.DeleteDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class DeleteDevice : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("admin/devices/{deviceId:guid}", async (
            Guid deviceId,
            ICommandHandler<DeleteDeviceCommand> handler,
            CancellationToken cancellationToken) =>
        {
            Result result = await handler.Handle(new DeleteDeviceCommand(deviceId), cancellationToken);
            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Permanently delete a revoked device (super admin)");
    }
}
