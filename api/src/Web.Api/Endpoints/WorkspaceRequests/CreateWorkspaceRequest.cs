using Application.Abstractions.Messaging;
using Application.WorkspaceRequests.CreateWorkspaceRequest;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.WorkspaceRequests;

internal sealed class CreateWorkspaceRequest : IEndpoint
{
    public sealed record Request(
        string CompanyName,
        string ContactName,
        string Email,
        string? Message);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("workspace-requests", async (
            Request request,
            ICommandHandler<CreateWorkspaceRequestCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateWorkspaceRequestCommand(
                request.CompanyName,
                request.ContactName,
                request.Email,
                request.Message);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                id => Results.Created($"/workspace-requests/{id}", new { id }),
                CustomResults.Problem);
        })
        .WithTags(Tags.WorkspaceRequests)
        .AllowAnonymous()
        .RequireRateLimiting(RateLimitPolicies.StandardApi)
        .WithSummary("Submit a public request to set up a Subl workspace (no auth)");
    }
}
