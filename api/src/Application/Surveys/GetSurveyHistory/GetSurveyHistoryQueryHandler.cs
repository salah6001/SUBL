using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Surveys.Common;
using Domain.Surveys;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Surveys.GetSurveyHistory;

internal sealed class GetSurveyHistoryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetSurveyHistoryQuery, List<SurveyResultResponse>>
{
    public async Task<Result<List<SurveyResultResponse>>> Handle(
        GetSurveyHistoryQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        var rows = await context.SurveyResponses
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.SubmittedAt)
            .Select(r => new
            {
                r.Id,
                r.SubmittedAt,
                r.TotalScore,
                AnswerCount = r.Answers.Count,
                r.Level
            })
            .ToListAsync(cancellationToken);

        var result = rows
            .Select(r => new SurveyResultResponse(
                r.Id,
                r.SubmittedAt,
                r.TotalScore,
                r.AnswerCount * SurveyResponse.MaxAnswerValue,
                r.Level.ToString()))
            .ToList();

        return Result.Success(result);
    }
}
