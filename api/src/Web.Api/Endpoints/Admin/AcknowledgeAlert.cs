using Application.Abstractions.Messaging;
using Application.Admin.AcknowledgeAlert;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Admin;

internal sealed class AcknowledgeAlert : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("admin/alerts/{id:guid}/acknowledge", async (
            Guid id,
            ICommandHandler<AcknowledgeAlertCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new AcknowledgeAlertCommand(id);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Acknowledge an alert (super admin)");
    }
}
