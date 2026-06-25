using Application.Abstractions.Messaging;

namespace Application.Articles.DeleteArticle;

public sealed record DeleteArticleCommand(Guid ArticleId) : ICommand;
