using Application.Abstractions.Messaging;
using Application.Articles.Common;
using Application.Articles.GetArticles;
using Domain.Articles;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Articles;

internal sealed class GetArticles : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("articles", async (
            int? page,
            int? pageSize,
            ArticleCategory? category,
            bool? includeUnpublished,
            IQueryHandler<GetArticlesQuery, PagedResult<ArticleListItemResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetArticlesQuery(
                page ?? 1,
                pageSize ?? 20,
                category,
                includeUnpublished ?? false);

            Result<PagedResult<ArticleListItemResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Articles)
        .RequireAuthorization()
        .WithSummary("Get a paginated list of articles (published only unless super admin)");
    }
}
