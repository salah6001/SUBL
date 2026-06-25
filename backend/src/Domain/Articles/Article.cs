using SharedKernel;

namespace Domain.Articles;

/// <summary>
/// A wellness content article shown to users and managed by admins.
/// </summary>
public sealed class Article : Entity
{
    public Guid Id { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Author { get; private set; }

    public string? AuthorRole { get; private set; }

    /// <summary>
    /// Human-readable read time, e.g. "6 min read".
    /// </summary>
    public string? ReadTime { get; private set; }

    public ArticleCategory Category { get; private set; }

    public string? Image { get; private set; }

    public string? Excerpt { get; private set; }

    /// <summary>
    /// Full article body (markdown / long text).
    /// </summary>
    public string Content { get; private set; } = string.Empty;

    public bool IsPublished { get; private set; }

    public DateTime? PublishedAt { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? UpdatedAt { get; private set; }

    private Article()
    {
    }

    public static Article Create(
        string title,
        string? author,
        string? authorRole,
        string? readTime,
        ArticleCategory category,
        string? image,
        string? excerpt,
        string content,
        bool isPublished)
    {
        return new Article
        {
            Id = Guid.NewGuid(),
            Title = title,
            Author = author,
            AuthorRole = authorRole,
            ReadTime = readTime,
            Category = category,
            Image = image,
            Excerpt = excerpt,
            Content = content,
            IsPublished = isPublished,
            PublishedAt = isPublished ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string title,
        string? author,
        string? authorRole,
        string? readTime,
        ArticleCategory category,
        string? image,
        string? excerpt,
        string content,
        bool isPublished)
    {
        Title = title;
        Author = author;
        AuthorRole = authorRole;
        ReadTime = readTime;
        Category = category;
        Image = image;
        Excerpt = excerpt;
        Content = content;

        // Stamp PublishedAt the first time it goes live.
        if (isPublished && !IsPublished)
        {
            PublishedAt = DateTime.UtcNow;
        }

        IsPublished = isPublished;
        UpdatedAt = DateTime.UtcNow;
    }
}
