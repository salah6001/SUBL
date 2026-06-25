using FluentValidation;

namespace Application.AuditLogs.GetActivityFeed;

internal sealed class GetActivityFeedQueryValidator : AbstractValidator<GetActivityFeedQuery>
{
    public GetActivityFeedQueryValidator()
    {
        RuleFor(q => q.Limit)
            .InclusiveBetween(1, 200)
            .WithMessage("Limit must be between 1 and 200");
    }
}
