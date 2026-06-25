using Application.Abstractions.Messaging;
using Application.Abstractions.Notifications;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Notifications;

internal sealed class TestNotification : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("api/notifications/test", async (
            INotificationService notificationService,
            Application.Abstractions.Identity.ICurrentUserService currentUserService,
            CancellationToken cancellationToken) =>
        {
            Guid userId = currentUserService.UserId;

            // Let the channels come from the type's defaults (in-app + email)
            // intersected with the user's own preferences, so this also verifies
            // real email delivery rather than only the in-app toast.
            await notificationService.Create("system.test")
                .ToUser(userId)
                .WithData(new { Message = "This is a test notification" })
                .WithPriority(Domain.Notifications.NotificationPriority.High)
                .SendAsync(cancellationToken);

            return Results.Ok(new { message = "Test notification sent" });
        })
        .WithTags(Tags.Notifications)
        .RequireAuthorization()
        .WithSummary("Sends a test notification to the current user");
    }
}
