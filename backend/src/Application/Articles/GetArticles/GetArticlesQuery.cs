using Application.Abstractions.Messaging;
using Application.Articles.Common;
using Domain.Articles;
using SharedKernel;

namespace Application.Articles.GetArticles;

/// <summary>
/// Returns a paginated list of articles. Non-admins only see published ones.
/// </summary>
public sealed record GetArticlesQuery(
    int Page = 1,
    int PageSize = 20,
    ArticleCategory? Category = null,
    bool IncludeUnpublished = false) : IQuery<PagedResult<ArticleListItemResponse>>;
