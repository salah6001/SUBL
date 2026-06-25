using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Stress.GetReadings;

internal sealed class GetReadingsQueryHandler(
    IStressReadingRepository stressRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetReadingsQuery, PagedResult<StressReadingResponse>>
{
    public async Task<Result<PagedResult<StressReadingResponse>>> Handle(
        GetReadingsQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        (List<StressReading> items, int totalCount) = await stressRepository.GetReadingsForUserAsync(
            userId,
            request.Page,
            request.PageSize,
            request.From,
            request.To,
            request.SessionId,
            cancellationToken);

        var responseItems = items
            .Select(r => new StressReadingResponse(
                r.Id,
                r.SessionId,
                r.Score,
                r.Level.ToString(),
                r.Confidence,
                r.ModelVersion,
                r.Emotion,
                r.CreatedAt))
            .ToList();

        var result = PagedResult<StressReadingResponse>.Create(
            responseItems,
            request.Page,
            request.PageSize,
            totalCount);

        return Result.Success(result);
    }
}
