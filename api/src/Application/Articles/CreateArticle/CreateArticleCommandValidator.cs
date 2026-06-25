using FluentValidation;

namespace Application.Articles.CreateArticle;

internal sealed class CreateArticleCommandValidator : AbstractValidator<CreateArticleCommand>
{
    public CreateArticleCommandValidator()
    {
        RuleFor(c => c.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(c => c.Category)
            .IsInEnum();

        RuleFor(c => c.Content)
            .NotEmpty();

        RuleFor(c => c.Excerpt)
            .MaximumLength(500);

        RuleFor(c => c.ReadTime)
            .MaximumLength(40);
    }
}
