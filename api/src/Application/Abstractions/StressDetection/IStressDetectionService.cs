namespace Application.Abstractions.StressDetection;

/// <summary>
/// Abstraction over the external ML stress-detection service.
/// The Infrastructure layer provides an HTTP client implementation that talks
/// to the Python (FastAPI) model service.
/// </summary>
public interface IStressDetectionService
{
    /// <summary>
    /// Sends keyboard features to the ML service and returns the predicted stress.
    /// Never throws on HTTP errors - returns a failure-shaped result instead
    /// (IsSuccess = false, ModelVersion = "unavailable") so callers can surface
    /// a domain error.
    /// </summary>
    Task<StressPredictionResult> PredictAsync(
        StressPredictionRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Whether the ML service is reachable. Used by health checks.
    /// </summary>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Input feature vector for the ML stress-detection model. Matches the
/// Python <c>FeatureInput</c> Pydantic model 1:1 (the HTTP service serializes
/// these to snake_case on the wire).
/// </summary>
/// <param name="MeanDwell">Average key-hold time in ms (must be &gt; 0).</param>
/// <param name="MedianFlight">Median time between keydowns in ms (must be &gt; 0).</param>
/// <param name="CvFlight">std(flight) / mean(flight) (must be &gt;= 0).</param>
/// <param name="MeanDelFreq">Deletion percentage 0..100 (must be &gt;= 0).</param>
/// <param name="MeanTotTime">Total elapsed time in ms (must be &gt; 0).</param>
/// <param name="NKeys">Total keystrokes in the window (must be &gt; 0).</param>
/// <param name="UserId">
/// Optional user identifier forwarded to the ML service for per-user
/// adaptation. The .NET handler fills this in from the JWT.
/// </param>
public sealed record StressPredictionRequest(
    double MeanDwell,
    double MedianFlight,
    double CvFlight,
    double MeanDelFreq,
    double MeanTotTime,
    int NKeys,
    string? UserId = null);

/// <summary>
/// Result returned by the ML service.
/// </summary>
public sealed record StressPredictionResult(
    bool IsSuccess,
    double Score,
    double Confidence,
    string ModelVersion,
    string? Emotion = null,
    string? Label = null,
    string? ErrorMessage = null,
    string? RawJsonMetadata = null);
