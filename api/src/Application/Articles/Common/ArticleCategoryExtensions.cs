using Domain.Articles;

namespace Application.Articles.Common;

/// <summary>
/// Maps <see cref="ArticleCategory"/> to the client-facing display name.
/// </summary>
internal static class ArticleCategoryExtensions
{
    public static string ToDisplayName(this ArticleCategory category) => category switch
    {
        ArticleCategory.StressManagement => "Stress Management",
        ArticleCategory.Technology => "Technology",
        ArticleCategory.Productivity => "Productivity",
        ArticleCategory.Nutrition => "Nutrition",
        ArticleCategory.Recovery => "Recovery",
        ArticleCategory.Leadership => "Leadership",
        _ => category.ToString()
    };
}
