using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Application.Abstractions.StressDetection;
using Application.StressDetection.Common;
using Domain.StressDetection;
using SharedKernel;

namespace Application.StressDetection.Stress.SubmitMetrics;

internal sealed class SubmitMetricsCommandHandler(
    IStressSessionRepository sessionRepository,
    IStressReadingRepository stressRepository,
    IStressDetectionService stressDetectionService,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<SubmitMetricsCommand, SubmitMetricsResponse>
{
    public async Task<Result<SubmitMetricsResponse>> Handle(
        SubmitMetricsCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        // 1) Verify the session exists, belongs to the user, and is still active.
        StressSession? session = await sessionRepository.GetByIdForUserAsync(
            request.SessionId,
            userId,
            cancellationToken);

        if (session is null)
        {
            return Result.Failure<SubmitMetricsResponse>(
                StressSessionErrors.NotFound(request.SessionId));
        }

        if (!session.IsActive())
        {
            return Result.Failure<SubmitMetricsResponse>(StressSessionErrors.NotActive);
        }

        // 2) Build the KeyboardMetrics row.
        var metrics = KeyboardMetrics.Create(
            request.SessionId,
            request.MeanDwell,
            request.MedianFlight,
            request.CvFlight,
            request.MeanDelFreq,
            request.MeanTotTime,
            request.NKeys,
            request.DeleteCount,
            request.CapturedAt);

        // 3) Call the ML model. The user id is forwarded to the Python
        // service so the model can do per-user adaptation if it wants to.
        StressPredictionResult prediction = await stressDetectionService.PredictAsync(
            new StressPredictionRequest(
                MeanDwell: metrics.MeanDwell,
                MedianFlight: metrics.MedianFlight,
                CvFlight: metrics.CvFlight,
                MeanDelFreq: metrics.MeanDelFreq,
                MeanTotTime: metrics.MeanTotTime,
                NKeys: metrics.NKeys,
                UserId: userId.ToString()),
            cancellationToken);

        if (!prediction.IsSuccess)
        {
            return Result.Failure<SubmitMetricsResponse>(
                StressReadingErrors.MlServiceFailed(prediction.ErrorMessage ?? "Unknown ML error"));
        }

        // 4) Persist metrics + reading and update session aggregates atomically.
        var reading = StressReading.Create(
            request.SessionId,
            metrics.Id,
            userId,
            prediction.Score,
            prediction.Confidence,
            prediction.ModelVersion,
            prediction.RawJsonMetadata);

        stressRepository.AddMetrics(metrics);
        stressRepository.AddReading(reading);

        session.RecordMetricSubmission();
        session.RecordStressReading(reading.Score);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        var response = new SubmitMetricsResponse(
            metrics.Id,
            reading.Id,
            reading.Score,
            reading.Level.ToString(),
            reading.Confidence);

        return Result.Success(response);
    }
}
