using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// The output of the ML stress-detection model for a single keyboard-metrics batch.
/// </summary>
public sealed class StressReading : Entity
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The session this reading belongs to.
    /// </summary>
    public Guid SessionId { get; private set; }

    /// <summary>
    /// The keyboard metrics batch that produced this reading (1:1).
    /// </summary>
    public Guid MetricsId { get; private set; }

    /// <summary>
    /// The user this reading belongs to.
    /// Denormalized for fast historical queries without a join.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// Stress score from the ML model, normalized to 0.0 - 1.0.
    /// </summary>
    public double Score { get; private set; }

    /// <summary>
    /// Categorical level derived from the score.
    /// </summary>
    public StressLevel Level { get; private set; }

    /// <summary>
    /// Model confidence (0.0 - 1.0). 0 if not provided.
    /// </summary>
    public double Confidence { get; private set; }

    /// <summary>
    /// Identifier/version of the ML model that produced this reading.
    /// </summary>
    public string ModelVersion { get; private set; } = string.Empty;

    /// <summary>
    /// Dominant emotion code from the ML model ("A"=Angry, "C"=Calm, "H"=Happy, "N"=Neutral, "S"=Sad).
    /// Null when the ML service did not return emotion data.
    /// </summary>
    public string? Emotion { get; private set; }

    /// <summary>
    /// Optional JSON metadata returned by the ML service (top features, etc.).
    /// </summary>
    public string? Metadata { get; private set; }

    /// <summary>
    /// When the reading was produced (server-side, after ML call).
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public StressSession? Session { get; init; }
    public KeyboardMetrics? Metrics { get; init; }

    private StressReading()
    {
    }

    public static StressReading Create(
        Guid sessionId,
        Guid metricsId,
        Guid userId,
        double score,
        double confidence,
        string modelVersion,
        string? metadata = null,
        string? emotion = null)
    {
        // Clamp score into [0,1] in case the ML service returns something noisy
        score = Math.Clamp(score, 0.0, 1.0);
        confidence = Math.Clamp(confidence, 0.0, 1.0);

        var reading = new StressReading
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            MetricsId = metricsId,
            UserId = userId,
            Score = score,
            Level = ClassifyLevel(score),
            Confidence = confidence,
            ModelVersion = modelVersion,
            Metadata = metadata,
            Emotion = emotion,
            CreatedAt = DateTime.UtcNow
        };

        reading.Raise(new StressReadingCreatedDomainEvent(
            reading.Id,
            sessionId,
            userId,
            reading.Level,
            score,
            confidence));

        if (reading.Level >= StressLevel.High)
        {
            reading.Raise(new HighStressDetectedDomainEvent(
                reading.Id,
                sessionId,
                userId,
                reading.Level,
                score));
        }

        return reading;
    }

    /// <summary>
    /// Maps a raw 0..1 score to a categorical stress level.
    /// Thresholds picked to roughly match common psychometric quartiles;
    /// they can be tuned later based on real data without breaking callers.
    /// </summary>
    public static StressLevel ClassifyLevel(double score) => score switch
    {
        < 0.30 => StressLevel.Low,
        < 0.60 => StressLevel.Moderate,
        < 0.85 => StressLevel.High,
        _ => StressLevel.Critical
    };
}
