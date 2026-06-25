using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Articles;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Articles.UpdateArticle;

internal sealed class UpdateArticleCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<UpdateArticleCommand>
{
    public async Task<Result> Handle(
        UpdateArticleCommand request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure(ArticleErrors.Forbidden);
        }

        Article? article = await context.Articles
            .FirstOrDefaultAsync(a => a.Id == request.ArticleId, cancellationToken);

        if (article is null)
        {
            return Result.Failure(ArticleErrors.NotFound(request.ArticleId));
        }

        article.Update(
            request.Title,
            request.Author,
            request.AuthorRole,
            request.ReadTime,
            request.Category,
            request.Image,
            request.Excerpt,
            request.Content,
            request.IsPublished);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
