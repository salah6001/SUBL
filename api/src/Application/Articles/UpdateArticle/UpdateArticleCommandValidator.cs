using FluentValidation;

namespace Application.Articles.UpdateArticle;

internal sealed class UpdateArticleCommandValidator : AbstractValidator<UpdateArticleCommand>
{
    public UpdateArticleCommandValidator()
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
