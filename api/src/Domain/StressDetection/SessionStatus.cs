namespace Domain.StressDetection;

/// <summary>
/// The status of a stress monitoring session.
/// </summary>
public enum SessionStatus
{
    /// <summary>
    /// Session is active and collecting keyboard data.
    /// </summary>
    Active = 1,

    /// <summary>
    /// Session is temporarily paused by the user.
    /// </summary>
    Paused = 2,

    /// <summary>
    /// Session was ended normally by the user.
    /// </summary>
    Completed = 3,

    /// <summary>
    /// Session was abandoned (no data received for too long).
    /// </summary>
    Abandoned = 4
}
