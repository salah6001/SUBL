using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Surveys.Common;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Surveys.GetSurveyQuestions;

internal sealed class GetSurveyQuestionsQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetSurveyQuestionsQuery, List<SurveyQuestionResponse>>
{
    public async Task<Result<List<SurveyQuestionResponse>>> Handle(
        GetSurveyQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        List<SurveyQuestionResponse> questions = await context.SurveyQuestions
            .AsNoTracking()
            .Where(q => q.IsActive)
            .OrderBy(q => q.Order)
            .Select(q => new SurveyQuestionResponse(q.Id, q.Text, q.Category, q.Order))
            .ToListAsync(cancellationToken);

        return Result.Success(questions);
    }
}
