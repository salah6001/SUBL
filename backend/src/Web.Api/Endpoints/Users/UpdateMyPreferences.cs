using Application.Abstractions.Messaging;
using Application.DeviceSettings;
using Application.DeviceSettings.UpdateMyPreferences;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Users;

internal sealed class UpdateMyPreferences : IEndpoint
{
    public sealed record Request(string Theme, string Language, string Timezone, string DateFormat);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("users/me/preferences", async (
            Request request,
            ICommandHandler<UpdateMyPreferencesCommand, PreferencesResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateMyPreferencesCommand(
                request.Theme,
                request.Language,
                request.Timezone,
                request.DateFormat);

            Result<PreferencesResponse> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Users)
        .RequireAuthorization()
        .WithSummary("Update the current user's UI preferences");
    }
}
