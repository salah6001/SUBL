namespace Domain.StressDetection;

/// <summary>
/// The level of stress detected from keyboard analysis.
/// </summary>
public enum StressLevel
{
    /// <summary>
    /// Low or no detectable stress.
    /// </summary>
    Low = 1,

    /// <summary>
    /// Moderate stress level - typical for focused work.
    /// </summary>
    Moderate = 2,

    /// <summary>
    /// High stress level - user may benefit from a break.
    /// </summary>
    High = 3,

    /// <summary>
    /// Critical stress level - immediate attention recommended.
    /// </summary>
    Critical = 4
}
