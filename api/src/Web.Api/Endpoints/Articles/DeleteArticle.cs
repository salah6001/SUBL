using Application.Abstractions.Messaging;
using Application.Articles.DeleteArticle;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Articles;

internal sealed class DeleteArticle : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete("articles/{id:guid}", async (
            Guid id,
            ICommandHandler<DeleteArticleCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new DeleteArticleCommand(id);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Articles)
        .RequireAuthorization()
        .WithSummary("Delete an article (super admin)");
    }
}
