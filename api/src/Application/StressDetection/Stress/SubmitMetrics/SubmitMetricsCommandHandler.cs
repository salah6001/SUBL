using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Notifications;
using Application.Abstractions.Repositories;
using Application.Abstractions.StressDetection;
using Application.StressDetection.Common;
using Domain.StressDetection;
using Microsoft.Extensions.Logging;
using SharedKernel;

namespace Application.StressDetection.Stress.SubmitMetrics;

internal sealed class SubmitMetricsCommandHandler(
    IStressSessionRepository sessionRepository,
    IStressReadingRepository stressRepository,
    IDeviceRepository deviceRepository,
    IStressDetectionService stressDetectionService,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService,
    INotificationService notificationService,
    ILogger<SubmitMetricsCommandHandler> logger)
    : ICommandHandler<SubmitMetricsCommand, SubmitMetricsResponse>
{
    public async Task<Result<SubmitMetricsResponse>> Handle(
        SubmitMetricsCommand request,
        CancellationToken cancellationToken)
    {
        // The caller is the desktop agent (the device registrant). The data,
        // however, is attributed to the session's owner — the user who claimed
        // the machine — which may differ from the agent's own account.
        Guid registrantId = currentUserService.UserId;

        // 1) Look up the session (NOT scoped to the caller, since the owner may
        //    differ from the agent's account) and verify it is still active.
        StressSession? session = await sessionRepository.GetByIdAsync(
            request.SessionId,
            cancellationToken);

        if (session is null)
        {
            return Result.Failure<SubmitMetricsResponse>(
                StressSessionErrors.NotFound(request.SessionId));
        }

        // 2) Authorize: the caller must be the device that owns this session.
        Device? device = await deviceRepository.GetByIdAsync(
            session.DeviceId,
            cancellationToken);

        if (device is null || device.UserId != registrantId)
        {
            // Don't leak the existence of other users' sessions.
            return Result.Failure<SubmitMetricsResponse>(
                StressSessionErrors.NotFound(request.SessionId));
        }

        if (!session.IsActive())
        {
            return Result.Failure<SubmitMetricsResponse>(StressSessionErrors.NotActive);
        }

        // The reading is attributed to the session owner (the claimer), set
        // when the session was started.
        Guid userId = session.UserId;

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

        // Capture before recording so we can fire a "session started" notification
        // on the very first reading of the session.
        bool isFirstReading = session.ReadingsCount == 0;

        session.RecordMetricSubmission();
        session.RecordStressReading(reading.Score);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        // Best-effort: notify the session owner that monitoring has started. This
        // drives delivery across every enabled channel (in-app/email/push/slack)
        // so the user sees a notification as soon as data starts flowing. Never
        // let a notification failure break metric ingestion.
        if (isFirstReading)
        {
            try
            {
                await notificationService
                    .Create("session.started")
                    .ToUser(userId)
                    .WithAction("/", "Open dashboard")
                    .SendAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                // Notification is non-critical; ingestion already succeeded.
                logger.LogWarning(ex, "Failed to send session.started notification for user {UserId}", userId);
            }
        }

        var response = new SubmitMetricsResponse(
            metrics.Id,
            reading.Id,
            reading.Score,
            reading.Level.ToString(),
            reading.Confidence);

        return Result.Success(response);
    }
}
