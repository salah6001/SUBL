using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Surveys.Common;
using Domain.Surveys;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Surveys.SubmitSurveyResponse;

internal sealed class SubmitSurveyResponseCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<SubmitSurveyResponseCommand, SurveyResultResponse>
{
    public async Task<Result<SurveyResultResponse>> Handle(
        SubmitSurveyResponseCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Answers.Count == 0)
        {
            return Result.Failure<SurveyResultResponse>(SurveyErrors.NoAnswers);
        }

        List<Guid> activeQuestionIds = await context.SurveyQuestions
            .AsNoTracking()
            .Where(q => q.IsActive)
            .Select(q => q.Id)
            .ToListAsync(cancellationToken);

        var activeSet = activeQuestionIds.ToHashSet();
        var answeredSet = request.Answers.Select(a => a.QuestionId).ToHashSet();

        // Every answered question must be a known active question.
        if (!answeredSet.IsSubsetOf(activeSet))
        {
            return Result.Failure<SurveyResultResponse>(SurveyErrors.UnknownQuestions);
        }

        // Every active question must be answered exactly once.
        if (answeredSet.Count != activeSet.Count || request.Answers.Count != activeSet.Count)
        {
            return Result.Failure<SurveyResultResponse>(SurveyErrors.MissingAnswers);
        }

        var answers = request.Answers
            .Select(a => (a.QuestionId, a.Value))
            .ToList();

        var response = SurveyResponse.Create(currentUserService.UserId, answers);

        context.SurveyResponses.Add(response);

        await context.SaveChangesAsync(cancellationToken);

        var result = new SurveyResultResponse(
            response.Id,
            response.SubmittedAt,
            response.TotalScore,
            activeSet.Count * SurveyResponse.MaxAnswerValue,
            response.Level.ToString());

        return Result.Success(result);
    }
}
