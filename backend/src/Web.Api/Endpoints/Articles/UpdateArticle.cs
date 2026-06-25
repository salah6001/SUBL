using Application.Abstractions.Messaging;
using Application.Articles.UpdateArticle;
using Domain.Articles;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Articles;

internal sealed class UpdateArticle : IEndpoint
{
    public sealed record Request(
        string Title,
        string? Author,
        string? AuthorRole,
        string? ReadTime,
        ArticleCategory Category,
        string? Image,
        string? Excerpt,
        string Content,
        bool IsPublished);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("articles/{id:guid}", async (
            Guid id,
            Request request,
            ICommandHandler<UpdateArticleCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new UpdateArticleCommand(
                id,
                request.Title,
                request.Author,
                request.AuthorRole,
                request.ReadTime,
                request.Category,
                request.Image,
                request.Excerpt,
                request.Content,
                request.IsPublished);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Articles)
        .RequireAuthorization()
        .WithSummary("Update an article (super admin)");
    }
}
