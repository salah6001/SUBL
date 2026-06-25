using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Articles;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Articles.DeleteArticle;

internal sealed class DeleteArticleCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<DeleteArticleCommand>
{
    public async Task<Result> Handle(
        DeleteArticleCommand request,
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

        context.Articles.Remove(article);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
