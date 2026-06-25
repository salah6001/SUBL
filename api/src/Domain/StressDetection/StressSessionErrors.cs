using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Domain errors for stress monitoring session operations.
/// </summary>
public static class StressSessionErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "StressSession.NotFound",
        $"The session with Id = '{id}' was not found");

    public static Error NotOwnedByUser => Error.Forbidden(
        "StressSession.NotOwnedByUser",
        "You do not have access to this session");

    public static Error AlreadyActive(Guid sessionId) => Error.Conflict(
        "StressSession.AlreadyActive",
        $"You already have an active session ('{sessionId}'). End it before starting a new one.");

    public static Error NotActive => Error.Conflict(
        "StressSession.NotActive",
        "The session is not active");

    public static Error AlreadyEnded => Error.Conflict(
        "StressSession.AlreadyEnded",
        "The session has already ended");

    public static Error DeviceMismatch => Error.Forbidden(
        "StressSession.DeviceMismatch",
        "The provided device is not the one that owns this session");
}
