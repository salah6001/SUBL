using Application.Abstractions.Messaging;
using Application.Notifications.ResolveNotification;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Notifications;

internal sealed class ResolveNotification : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("notifications/{id:guid}/resolve", async (
            Guid id,
            ICommandHandler<ResolveNotificationCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ResolveNotificationCommand(id);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Notifications)
        .RequireAuthorization()
        .WithSummary("Resolve a notification (mark as acted upon)");
    }
}
