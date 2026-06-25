using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain errors for stress reading and ML pipeline operations.
/// </summary>
public static class StressReadingErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "StressReading.NotFound",
        $"The stress reading with Id = '{id}' was not found");

    public static Error MlServiceUnavailable => Error.Failure(
        "StressDetection.MlServiceUnavailable",
        "The stress detection model service is currently unavailable. Please try again later.");

    public static Error MlServiceFailed(string reason) => Error.Failure(
        "StressDetection.MlServiceFailed",
        $"The ML model returned an error: {reason}");

    public static Error InvalidMetrics(string reason) => Error.Validation(
        "StressDetection.InvalidMetrics",
        $"The submitted keyboard metrics are invalid: {reason}");
}
