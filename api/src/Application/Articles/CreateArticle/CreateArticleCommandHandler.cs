using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Articles;
using SharedKernel;

namespace Application.Articles.CreateArticle;

internal sealed class CreateArticleCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<CreateArticleCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateArticleCommand request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<Guid>(ArticleErrors.Forbidden);
        }

        var article = Article.Create(
            request.Title,
            request.Author,
            request.AuthorRole,
            request.ReadTime,
            request.Category,
            request.Image,
            request.Excerpt,
            request.Content,
            request.IsPublished);

        context.Articles.Add(article);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(article.Id);
    }
}
