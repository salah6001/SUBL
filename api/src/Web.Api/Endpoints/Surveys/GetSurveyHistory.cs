using Application.Abstractions.Messaging;
using Application.Surveys.Common;
using Application.Surveys.GetSurveyHistory;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Surveys;

internal sealed class GetSurveyHistory : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("survey/responses", async (
            IQueryHandler<GetSurveyHistoryQuery, List<SurveyResultResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSurveyHistoryQuery();

            Result<List<SurveyResultResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Surveys)
        .RequireAuthorization()
        .WithSummary("Get the current user's past survey results");
    }
}
