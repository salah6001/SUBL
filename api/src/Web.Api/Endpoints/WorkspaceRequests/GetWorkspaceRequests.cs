using Application.Abstractions.Messaging;
using Application.WorkspaceRequests.Common;
using Application.WorkspaceRequests.GetWorkspaceRequests;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.WorkspaceRequests;

internal sealed class GetWorkspaceRequests : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("workspace-requests", async (
            string? status,
            IQueryHandler<GetWorkspaceRequestsQuery, IReadOnlyList<WorkspaceRequestResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetWorkspaceRequestsQuery(status);

            Result<IReadOnlyList<WorkspaceRequestResponse>> result =
                await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.WorkspaceRequests)
        .RequireAuthorization()
        .WithSummary("List workspace requests (admin)");
    }
}
