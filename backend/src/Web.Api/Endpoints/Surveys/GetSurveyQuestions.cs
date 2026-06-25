using Application.Abstractions.Messaging;
using Application.Surveys.Common;
using Application.Surveys.GetSurveyQuestions;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Surveys;

internal sealed class GetSurveyQuestions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("survey/questions", async (
            IQueryHandler<GetSurveyQuestionsQuery, List<SurveyQuestionResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSurveyQuestionsQuery();

            Result<List<SurveyQuestionResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Surveys)
        .RequireAuthorization()
        .WithSummary("Get the active stress assessment questions");
    }
}
