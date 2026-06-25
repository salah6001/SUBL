using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.SubmitMetrics;

/// <summary>
/// Command issued by the desktop agent at the end of every batch window
/// (e.g. every 30 seconds) with the 6 privacy-safe keyboard features.
/// The handler runs the ML model and persists both the metrics and the
/// resulting stress reading.
/// </summary>
public sealed record SubmitMetricsCommand(
    Guid SessionId,
    double MeanDwell,
    double MedianFlight,
    double CvFlight,
    double MeanDelFreq,
    double MeanTotTime,
    int NKeys,
    int? DeleteCount = null,
    DateTime? CapturedAt = null) : ICommand<SubmitMetricsResponse>;
