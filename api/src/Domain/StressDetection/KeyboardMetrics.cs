using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// A single batch of aggregated keyboard metrics submitted by the desktop agent.
/// We never store the actual keys pressed - only privacy-safe aggregates.
/// These features are the input to the ML stress-detection model.
///
/// Field names mirror the model's FeatureInput contract:
///   mean_dwell, median_flight, cv_flight, mean_del_freq, mean_tot_time, n_keys.
/// </summary>
public sealed class KeyboardMetrics : Entity
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The session this batch belongs to.
    /// </summary>
    public Guid SessionId { get; private set; }

    /// <summary>
    /// Average key-hold time in milliseconds (keyup - keydown), aggregated
    /// over every key in the window.
    /// </summary>
    public double MeanDwell { get; private set; }

    /// <summary>
    /// Median time in milliseconds between two consecutive keydowns.
    /// </summary>
    public double MedianFlight { get; private set; }

    /// <summary>
    /// Coefficient of variation of flight time: std(flight) / mean(flight).
    /// Higher values mean a more erratic typing rhythm.
    /// </summary>
    public double CvFlight { get; private set; }

    /// <summary>
    /// Percentage of presses that were Backspace or Delete (0-100).
    /// </summary>
    public double MeanDelFreq { get; private set; }

    /// <summary>
    /// Total elapsed time in milliseconds covered by this batch
    /// (from the first keypress until the agent flushed the window).
    /// </summary>
    public double MeanTotTime { get; private set; }

    /// <summary>
    /// Total keystrokes counted in the window.
    /// </summary>
    public int NKeys { get; private set; }

    /// <summary>
    /// Number of backspace/delete presses in the window.
    /// </summary>
    public int? DeleteCount { get; private set; }

    /// <summary>
    /// Client-side capture timestamp (UTC) when the agent flushed the window.
    /// </summary>
    public DateTime? CapturedAt { get; private set; }

    /// <summary>
    /// When the agent submitted this batch to the server.
    /// </summary>
    public DateTime ReceivedAt { get; private set; }

    // Navigation
    public StressSession? Session { get; init; }

    private KeyboardMetrics()
    {
    }

    public static KeyboardMetrics Create(
        Guid sessionId,
        double meanDwell,
        double medianFlight,
        double cvFlight,
        double meanDelFreq,
        double meanTotTime,
        int nKeys,
        int? deleteCount = null,
        DateTime? capturedAt = null)
    {
        DateTime? normalizedCapturedAt = null;
        if (capturedAt.HasValue)
        {
            DateTime value = capturedAt.Value;
            normalizedCapturedAt = value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime();
        }

        return new KeyboardMetrics
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            MeanDwell = meanDwell,
            MedianFlight = medianFlight,
            CvFlight = cvFlight,
            MeanDelFreq = Math.Clamp(meanDelFreq, 0.0, 100.0),
            MeanTotTime = meanTotTime,
            NKeys = nKeys,
            DeleteCount = deleteCount.HasValue ? Math.Max(0, deleteCount.Value) : null,
            CapturedAt = normalizedCapturedAt,
            ReceivedAt = DateTime.UtcNow
        };
    }
}
