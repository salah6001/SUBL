namespace Infrastructure.StressDetection;

/// <summary>
/// Configuration for the external Python ML stress-detection service.
/// Bound from the "StressDetection" section in appsettings.json.
/// </summary>
public sealed class StressDetectionSettings
{
    public const string SectionName = "StressDetection";

    /// <summary>
    /// Base URL of the Python FastAPI ML service (e.g. http://localhost:8000).
    /// </summary>
    public string BaseUrl { get; set; } = "http://localhost:8000";

    /// <summary>
    /// Optional shared secret sent as the X-API-Key header. Empty = no header.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Per-request timeout in seconds.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Path of the predict endpoint (POST). Defaults to /predict.
    /// </summary>
    public string PredictPath { get; set; } = "/predict";

    /// <summary>
    /// Path of the health endpoint (GET). Defaults to /health.
    /// </summary>
    public string HealthPath { get; set; } = "/health";
}
