using FluentValidation;

namespace Application.Habits.CreateHabit;

internal sealed class CreateHabitCommandValidator : AbstractValidator<CreateHabitCommand>
{
    public CreateHabitCommandValidator()
    {
        RuleFor(c => c.Label)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(c => c.Category)
            .IsInEnum();

        RuleFor(c => c.Icon)
            .MaximumLength(50);
    }
}
