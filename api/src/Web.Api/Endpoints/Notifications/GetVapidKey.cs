using Infrastructure.Notifications;
using Microsoft.Extensions.Options;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Notifications;

internal sealed class GetVapidKey : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("notifications/vapid-public-key", (IOptions<WebPushSettings> settings) =>
        {
            WebPushSettings webPush = settings.Value;

            return webPush.IsConfigured
                ? Results.Ok(new { publicKey = webPush.PublicKey })
                : Results.Ok(new { publicKey = (string?)null });
        })
        .WithTags(Tags.Notifications)
        .RequireAuthorization()
        .WithSummary("Returns the VAPID public key for browser Web Push subscription");
    }
}
