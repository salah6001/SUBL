using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Stress.GetCurrentStress;

internal sealed class GetCurrentStressQueryHandler(
    IStressReadingRepository stressRepository,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetCurrentStressQuery, CurrentStressResponse>
{
    public async Task<Result<CurrentStressResponse>> Handle(
        GetCurrentStressQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        StressReading? latest = await stressRepository.GetLatestReadingAsync(
            userId,
            cancellationToken);

        if (latest is null)
        {
            return Result.Success(new CurrentStressResponse(false, null, null, null, null));
        }

        var response = new CurrentStressResponse(
            true,
            latest.Score,
            latest.Level.ToString(),
            latest.CreatedAt,
            latest.SessionId);

        return Result.Success(response);
    }
}
