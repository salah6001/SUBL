using FluentValidation;

namespace Application.Habits.UpdateHabit;

internal sealed class UpdateHabitCommandValidator : AbstractValidator<UpdateHabitCommand>
{
    public UpdateHabitCommandValidator()
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
