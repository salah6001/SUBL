using Application.Abstractions.Messaging;
using Application.Surveys.Common;
using Application.Surveys.SubmitSurveyResponse;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Surveys;

internal sealed class SubmitSurveyResponse : IEndpoint
{
    public sealed record Request(IReadOnlyList<SurveyAnswerInput> Answers);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("survey/responses", async (
            Request request,
            ICommandHandler<SubmitSurveyResponseCommand, SurveyResultResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new SubmitSurveyResponseCommand(request.Answers);

            Result<SurveyResultResponse> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Surveys)
        .RequireAuthorization()
        .WithSummary("Submit a completed stress assessment and get the computed score");
    }
}
