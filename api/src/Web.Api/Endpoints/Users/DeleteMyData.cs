using Application.Abstractions.Messaging;
using Application.Users.DeleteMyData;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Users;

internal sealed class DeleteMyData : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("users/me/data", async (
            ICommandHandler<DeleteMyDataCommand> handler,
            CancellationToken cancellationToken) =>
        {
            Result result = await handler.Handle(new DeleteMyDataCommand(), cancellationToken);
            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .RequireAuthorization()
        .WithTags(Tags.Users)
        .WithSummary("Erase all of the current user's monitoring data");
    }
}
