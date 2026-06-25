using Application.Abstractions.Messaging;
using Application.DeviceSettings;
using Application.DeviceSettings.GetMyPreferences;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Users;

internal sealed class GetMyPreferences : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("users/me/preferences", async (
            IQueryHandler<GetMyPreferencesQuery, PreferencesResponse> handler,
            CancellationToken cancellationToken) =>
        {
            Result<PreferencesResponse> result =
                await handler.Handle(new GetMyPreferencesQuery(), cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Users)
        .RequireAuthorization()
        .WithSummary("Get the current user's UI preferences (theme, language, timezone, date format)");
    }
}
