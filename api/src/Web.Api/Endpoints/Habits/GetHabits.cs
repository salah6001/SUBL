using Application.Abstractions.Messaging;
using Application.Habits.Common;
using Application.Habits.GetHabits;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Habits;

internal sealed class GetHabits : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("habits", async (
            bool? includeInactive,
            IQueryHandler<GetHabitsQuery, List<HabitResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetHabitsQuery(includeInactive ?? false);

            Result<List<HabitResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Habits)
        .RequireAuthorization()
        .WithSummary("List the current user's habits with streaks and today's completion status");
    }
}
