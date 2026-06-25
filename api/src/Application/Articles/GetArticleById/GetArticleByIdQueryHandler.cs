using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Articles.Common;
using Domain.Articles;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Articles.GetArticleById;

internal sealed class GetArticleByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetArticleByIdQuery, ArticleResponse>
{
    public async Task<Result<ArticleResponse>> Handle(
        GetArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        Article? article = await context.Articles
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.ArticleId, cancellationToken);

        // Unpublished articles are only visible to super admins.
        if (article is null || !article.IsPublished && !currentUserService.IsSuperAdmin)
        {
            return Result.Failure<ArticleResponse>(ArticleErrors.NotFound(request.ArticleId));
        }

        var response = new ArticleResponse(
            article.Id,
            article.Title,
            article.Author,
            article.AuthorRole,
            article.ReadTime,
            article.Category.ToDisplayName(),
            article.Image,
            article.Excerpt,
            article.Content,
            article.IsPublished,
            article.PublishedAt,
            article.CreatedAt,
            article.UpdatedAt);

        return Result.Success(response);
    }
}
