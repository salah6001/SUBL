using Domain.Users;
using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Represents a single monitoring session in which the desktop agent
/// collects keyboard metrics from the user. A session has a start and end time
/// and aggregates many keyboard metric submissions and stress readings.
/// </summary>
public sealed class StressSession : Entity
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The user this session belongs to.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// The device that is collecting data for this session.
    /// </summary>
    public Guid DeviceId { get; private set; }

    /// <summary>
    /// Current status of the session.
    /// </summary>
    public SessionStatus Status { get; private set; }

    /// <summary>
    /// When the session was started.
    /// </summary>
    public DateTime StartedAt { get; private set; }

    /// <summary>
    /// When the session was ended (or null if still running).
    /// </summary>
    public DateTime? EndedAt { get; private set; }

    /// <summary>
    /// Last time the agent submitted data for this session.
    /// Used to detect abandoned sessions.
    /// </summary>
    public DateTime? LastActivityAt { get; private set; }

    /// <summary>
    /// Total number of keyboard metric submissions in this session.
    /// </summary>
    public int MetricsCount { get; private set; }

    /// <summary>
    /// Total number of stress readings produced from this session.
    /// </summary>
    public int ReadingsCount { get; private set; }

    /// <summary>
    /// Average stress score (0.0 - 1.0) over the lifetime of the session.
    /// Updated incrementally as new readings come in.
    /// </summary>
    public double AverageStressScore { get; private set; }

    /// <summary>
    /// Highest stress score observed during the session.
    /// </summary>
    public double PeakStressScore { get; private set; }

    /// <summary>
    /// Optional notes the user attached to the session (e.g. "Working on math homework").
    /// </summary>
    public string? Notes { get; private set; }

    /// <summary>
    /// Reason the session was ended (Completed, Abandoned, ...).
    /// </summary>
    public string? EndReason { get; private set; }

    // Navigation
    public User? User { get; init; }
    public Device? Device { get; init; }
    public List<StressReading> Readings { get; private set; } = [];

    private StressSession()
    {
    }

    public static StressSession Start(Guid userId, Guid deviceId, string? notes = null)
    {
        var session = new StressSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DeviceId = deviceId,
            Status = SessionStatus.Active,
            StartedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            MetricsCount = 0,
            ReadingsCount = 0,
            AverageStressScore = 0,
            PeakStressScore = 0,
            Notes = notes
        };

        session.Raise(new SessionStartedDomainEvent(session.Id, userId, deviceId));

        return session;
    }

    public void End(string? reason = null)
    {
        if (Status is SessionStatus.Completed or SessionStatus.Abandoned)
        {
            return;
        }

        Status = SessionStatus.Completed;
        EndedAt = DateTime.UtcNow;
        EndReason = reason;

        Raise(new SessionEndedDomainEvent(Id, UserId, AverageStressScore, PeakStressScore));
    }

    public void Pause()
    {
        if (Status != SessionStatus.Active)
        {
            return;
        }

        Status = SessionStatus.Paused;
    }

    public void Resume()
    {
        if (Status != SessionStatus.Paused)
        {
            return;
        }

        Status = SessionStatus.Active;
        LastActivityAt = DateTime.UtcNow;
    }

    public void MarkAsAbandoned()
    {
        if (Status is SessionStatus.Completed or SessionStatus.Abandoned)
        {
            return;
        }

        Status = SessionStatus.Abandoned;
        EndedAt = DateTime.UtcNow;
        EndReason = "No activity received within the timeout window";

        Raise(new SessionEndedDomainEvent(Id, UserId, AverageStressScore, PeakStressScore));
    }

    /// <summary>
    /// Records that a new keyboard metric submission was received.
    /// Caller is expected to also persist the metric and reading separately.
    /// </summary>
    public void RecordMetricSubmission()
    {
        MetricsCount += 1;
        LastActivityAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates the running aggregates with a newly produced stress reading.
    /// </summary>
    public void RecordStressReading(double score)
    {
        // Running average: avg' = avg + (score - avg) / (n + 1)
        ReadingsCount += 1;
        AverageStressScore += (score - AverageStressScore) / ReadingsCount;

        if (score > PeakStressScore)
        {
            PeakStressScore = score;
        }

        LastActivityAt = DateTime.UtcNow;
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes;
    }

    public bool IsActive() => Status is SessionStatus.Active or SessionStatus.Paused;

    public TimeSpan Duration() =>
        (EndedAt ?? DateTime.UtcNow) - StartedAt;
}
