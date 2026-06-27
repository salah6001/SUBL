using Application.Abstractions.Messaging;
using Application.WorkspaceRequests.ApproveWorkspaceRequest;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.WorkspaceRequests;

internal sealed class ApproveWorkspaceRequest : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("workspace-requests/{id:guid}/approve", async (
            Guid id,
            ICommandHandler<ApproveWorkspaceRequestCommand, ApproveWorkspaceRequestResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ApproveWorkspaceRequestCommand(id);

            Result<ApproveWorkspaceRequestResponse> result =
                await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.WorkspaceRequests)
        .RequireAuthorization()
        .WithSummary("Approve a workspace request — provisions an admin account (admin)");
    }
}
