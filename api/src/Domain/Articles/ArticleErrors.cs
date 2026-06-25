using SharedKernel;

namespace Domain.Articles;

public static class ArticleErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "Article.NotFound",
        $"The article with Id = '{id}' was not found");

    public static readonly Error Forbidden = Error.Forbidden(
        "Article.Forbidden",
        "You are not allowed to manage articles.");
}
