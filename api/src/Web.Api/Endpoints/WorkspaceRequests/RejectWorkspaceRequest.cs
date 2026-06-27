using Application.Abstractions.Messaging;
using Application.WorkspaceRequests.RejectWorkspaceRequest;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.WorkspaceRequests;

internal sealed class RejectWorkspaceRequest : IEndpoint
{
    public sealed record Request(string? Note);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("workspace-requests/{id:guid}/reject", async (
            Guid id,
            Request request,
            ICommandHandler<RejectWorkspaceRequestCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new RejectWorkspaceRequestCommand(id, request.Note);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(
                () => Results.Ok(new { message = "Request rejected." }),
                CustomResults.Problem);
        })
        .WithTags(Tags.WorkspaceRequests)
        .RequireAuthorization()
        .WithSummary("Reject a workspace request (admin)");
    }
}
