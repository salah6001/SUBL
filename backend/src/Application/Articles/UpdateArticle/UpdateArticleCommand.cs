using Application.Abstractions.Messaging;
using Domain.Articles;

namespace Application.Articles.UpdateArticle;

public sealed record UpdateArticleCommand(
    Guid ArticleId,
    string Title,
    string? Author,
    string? AuthorRole,
    string? ReadTime,
    ArticleCategory Category,
    string? Image,
    string? Excerpt,
    string Content,
    bool IsPublished) : ICommand;
