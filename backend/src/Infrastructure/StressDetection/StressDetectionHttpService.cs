using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Abstractions.StressDetection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.StressDetection;

/// <summary>
/// Talks to the external Python (FastAPI) ML model service over HTTP.
/// Wire format matches the Python <c>FeatureInput</c> Pydantic model:
/// snake_case fields, all numeric, plus an optional user_id.
/// </summary>
internal sealed class StressDetectionHttpService(
    HttpClient httpClient,
    IOptions<StressDetectionSettings> settings,
    ILogger<StressDetectionHttpService> logger)
    : IStressDetectionService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<StressPredictionResult> PredictAsync(
        StressPredictionRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new MlPredictRequest(
                request.MeanDwell,
                request.MedianFlight,
                request.CvFlight,
                request.MeanDelFreq,
                request.MeanTotTime,
                request.NKeys,
                request.UserId);

            HttpResponseMessage response = await httpClient.PostAsJsonAsync(
                settings.Value.PredictPath,
                payload,
                JsonOptions,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                string body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning(
                    "ML service returned {StatusCode} for prediction request: {Body}",
                    (int)response.StatusCode,
                    body);

                return new StressPredictionResult(
                    IsSuccess: false,
                    Score: 0,
                    Confidence: 0,
                    ModelVersion: "unavailable",
                    ErrorMessage: $"HTTP {(int)response.StatusCode}: {Truncate(body, 200)}");
            }

            MlPredictResponse? result = await response.Content.ReadFromJsonAsync<MlPredictResponse>(
                JsonOptions,
                cancellationToken);

            if (result is null)
            {
                return new StressPredictionResult(
                    IsSuccess: false,
                    Score: 0,
                    Confidence: 0,
                    ModelVersion: "unavailable",
                    ErrorMessage: "Empty response body from ML service");
            }

            return new StressPredictionResult(
                IsSuccess: true,
                Score: result.Score,
                Confidence: result.Confidence,
                ModelVersion: string.IsNullOrWhiteSpace(result.ModelVersion) ? "unknown" : result.ModelVersion,
                Label: result.Label,
                ErrorMessage: null,
                RawJsonMetadata: result.Metadata);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            // HttpClient timeout (cancellationToken still active)
            logger.LogWarning(ex, "ML service request timed out");
            return new StressPredictionResult(
                IsSuccess: false,
                Score: 0,
                Confidence: 0,
                ModelVersion: "unavailable",
                ErrorMessage: "Timeout calling ML service");
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "Failed to call ML stress-detection service");
            return new StressPredictionResult(
                IsSuccess: false,
                Score: 0,
                Confidence: 0,
                ModelVersion: "unavailable",
                ErrorMessage: ex.Message);
        }
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            HttpResponseMessage response = await httpClient.GetAsync(
                settings.Value.HealthPath,
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return false;
        }
    }

    private static string Truncate(string s, int max) =>
        string.IsNullOrEmpty(s) || s.Length <= max ? s : s[..max] + "…";

    /// <summary>
    /// Wire format sent to the Python ML service. Mirrors the Python
    /// <c>FeatureInput</c> Pydantic model exactly:
    ///
    ///     class FeatureInput(BaseModel):
    ///         mean_dwell:     float = Field(..., gt=0)
    ///         median_flight:  float = Field(..., gt=0)
    ///         cv_flight:      float = Field(..., ge=0)
    ///         mean_del_freq:  float = Field(..., ge=0)
    ///         mean_tot_time:  float = Field(..., gt=0)
    ///         n_keys:         int   = Field(..., gt=0)
    ///         user_id:        Optional[str] = None
    /// </summary>
    private sealed record MlPredictRequest(
        [property: JsonPropertyName("mean_dwell")] double MeanDwell,
        [property: JsonPropertyName("median_flight")] double MedianFlight,
        [property: JsonPropertyName("cv_flight")] double CvFlight,
        [property: JsonPropertyName("mean_del_freq")] double MeanDelFreq,
        [property: JsonPropertyName("mean_tot_time")] double MeanTotTime,
        [property: JsonPropertyName("n_keys")] int NKeys,
        [property: JsonPropertyName("user_id")] string? UserId);

    /// <summary>
    /// Expected response from the Python ML service. <c>label</c> and
    /// <c>metadata</c> are optional - the service may omit them.
    /// </summary>
    private sealed record MlPredictResponse(
        [property: JsonPropertyName("score")] double Score,
        [property: JsonPropertyName("confidence")] double Confidence,
        [property: JsonPropertyName("model_version")] string? ModelVersion,
        [property: JsonPropertyName("label")] string? Label,
        [property: JsonPropertyName("metadata")] string? Metadata);
}
