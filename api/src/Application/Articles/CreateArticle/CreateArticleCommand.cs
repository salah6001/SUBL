using Application.Abstractions.Messaging;
using Domain.Articles;

namespace Application.Articles.CreateArticle;

public sealed record CreateArticleCommand(
    string Title,
    string? Author,
    string? AuthorRole,
    string? ReadTime,
    ArticleCategory Category,
    string? Image,
    string? Excerpt,
    string Content,
    bool IsPublished) : ICommand<Guid>;
