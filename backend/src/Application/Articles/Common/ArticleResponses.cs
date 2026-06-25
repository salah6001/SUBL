namespace Application.Articles.Common;

/// <summary>
/// List/summary view of an article (no full content).
/// </summary>
public sealed record ArticleListItemResponse(
    Guid Id,
    string Title,
    string? Author,
    string? AuthorRole,
    string? ReadTime,
    string Category,
    string? Image,
    string? Excerpt,
    bool IsPublished,
    DateTime? PublishedAt);

/// <summary>
/// Full article including its content body.
/// </summary>
public sealed record ArticleResponse(
    Guid Id,
    string Title,
    string? Author,
    string? AuthorRole,
    string? ReadTime,
    string Category,
    string? Image,
    string? Excerpt,
    string Content,
    bool IsPublished,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
