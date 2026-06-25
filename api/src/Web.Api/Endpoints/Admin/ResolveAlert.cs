using Application.Abstractions.Messaging;
using Application.Admin.ResolveAlert;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class ResolveAlert : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("admin/alerts/{id:guid}/resolve", async (
            Guid id,
            ICommandHandler<ResolveAlertCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ResolveAlertCommand(id);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Resolve an alert (super admin)");
    }
}
