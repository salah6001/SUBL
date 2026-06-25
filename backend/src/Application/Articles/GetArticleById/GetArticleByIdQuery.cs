using Application.Abstractions.Messaging;
using Application.Articles.Common;

namespace Application.Articles.GetArticleById;

public sealed record GetArticleByIdQuery(Guid ArticleId) : IQuery<ArticleResponse>;
