using Domain.Common;
using SharedKernel;

namespace Domain.Alerts;

/// <summary>
/// An admin-facing alert raised about a user's wellbeing (e.g. high stress),
/// which admins can acknowledge and resolve.
/// </summary>
public sealed class StressAlert : Entity
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The user the alert is about.
    /// </summary>
    public Guid UserId { get; private set; }

    public Department Department { get; private set; }

    public AlertCategory Category { get; private set; }

    public AlertSeverity Severity { get; private set; }

    public AlertStatus Status { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string? Message { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? AcknowledgedAt { get; private set; }

    public DateTime? ResolvedAt { get; private set; }

    private StressAlert()
    {
    }

    public static StressAlert Create(
        Guid userId,
        Department department,
        AlertCategory category,
        AlertSeverity severity,
        string title,
        string? message)
    {
        return new StressAlert
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Department = department,
            Category = category,
            Severity = severity,
            Status = AlertStatus.Open,
            Title = title,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Acknowledge()
    {
        if (Status != AlertStatus.Open)
        {
            return;
        }

        Status = AlertStatus.Acknowledged;
        AcknowledgedAt = DateTime.UtcNow;
    }

    public void Resolve()
    {
        if (Status == AlertStatus.Resolved)
        {
            return;
        }

        Status = AlertStatus.Resolved;
        ResolvedAt = DateTime.UtcNow;
    }
}
