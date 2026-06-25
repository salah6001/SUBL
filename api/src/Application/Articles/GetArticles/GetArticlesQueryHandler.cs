using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Articles.Common;
using Domain.Articles;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Articles.GetArticles;

internal sealed class GetArticlesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetArticlesQuery, PagedResult<ArticleListItemResponse>>
{
    public async Task<Result<PagedResult<ArticleListItemResponse>>> Handle(
        GetArticlesQuery request,
        CancellationToken cancellationToken)
    {
        IQueryable<Article> query = context.Articles.AsNoTracking();

        // Only super admins may see unpublished content.
        bool includeUnpublished = request.IncludeUnpublished && currentUserService.IsSuperAdmin;
        if (!includeUnpublished)
        {
            query = query.Where(a => a.IsPublished);
        }

        if (request.Category is { } category)
        {
            query = query.Where(a => a.Category == category);
        }

        int totalCount = await query.CountAsync(cancellationToken);

        List<Article> articles = await query
            .OrderByDescending(a => a.PublishedAt ?? a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = articles
            .Select(a => new ArticleListItemResponse(
                a.Id,
                a.Title,
                a.Author,
                a.AuthorRole,
                a.ReadTime,
                a.Category.ToDisplayName(),
                a.Image,
                a.Excerpt,
                a.IsPublished,
                a.PublishedAt))
            .ToList();

        return Result.Success(PagedResult<ArticleListItemResponse>.Create(
            items,
            request.Page,
            request.PageSize,
            totalCount));
    }
}
