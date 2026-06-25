using Application.Abstractions.Messaging;
using Application.Articles.Common;
using Application.Articles.GetArticleById;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Articles;

internal sealed class GetArticleById : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("articles/{id:guid}", async (
            Guid id,
            IQueryHandler<GetArticleByIdQuery, ArticleResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetArticleByIdQuery(id);

            Result<ArticleResponse> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Articles)
        .RequireAuthorization()
        .WithSummary("Get a single article with full content");
    }
}
