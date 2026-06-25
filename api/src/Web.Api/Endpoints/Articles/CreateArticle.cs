using Application.Abstractions.Messaging;
using Application.Articles.CreateArticle;
using Domain.Articles;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Articles;

internal sealed class CreateArticle : IEndpoint
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
        app.MapPost("articles", async (
            Request request,
            ICommandHandler<CreateArticleCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateArticleCommand(
                request.Title,
                request.Author,
                request.AuthorRole,
                request.ReadTime,
                request.Category,
                request.Image,
                request.Excerpt,
                request.Content,
                request.IsPublished);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                id => Results.Created($"/articles/{id}", new { id }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Articles)
        .RequireAuthorization()
        .WithSummary("Create an article (super admin)");
    }
}
