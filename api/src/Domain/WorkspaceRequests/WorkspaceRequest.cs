using SharedKernel;

namespace Domain.WorkspaceRequests;

/// <summary>
/// A request submitted from the public landing page asking to set up a Subl
/// workspace for an organisation. An existing administrator reviews it; on
/// approval the system provisions an admin account for the contact and emails
/// them their sign-in details. No password is ever collected on the public
/// form — credentials are generated server-side at approval time.
/// </summary>
public sealed class WorkspaceRequest : Entity
{
    public Guid Id { get; private set; }

    public string CompanyName { get; private set; } = string.Empty;

    public string ContactName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string? Message { get; private set; }

    public WorkspaceRequestStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime? ReviewedAt { get; private set; }

    /// <summary>
    /// The admin user that was created when this request was approved.
    /// </summary>
    public Guid? CreatedUserId { get; private set; }

    /// <summary>
    /// Optional note left by the reviewer (e.g. a reason for rejection).
    /// </summary>
    public string? ReviewNote { get; private set; }

    private WorkspaceRequest()
    {
    }

    public static WorkspaceRequest Create(
        string companyName,
        string contactName,
        string email,
        string? message)
    {
        return new WorkspaceRequest
        {
            Id = Guid.NewGuid(),
            CompanyName = companyName.Trim(),
            ContactName = contactName.Trim(),
            Email = email.Trim(),
            Message = string.IsNullOrWhiteSpace(message) ? null : message.Trim(),
            Status = WorkspaceRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Approve(Guid createdUserId)
    {
        Status = WorkspaceRequestStatus.Approved;
        CreatedUserId = createdUserId;
        ReviewedAt = DateTime.UtcNow;
    }

    public void Reject(string? note)
    {
        Status = WorkspaceRequestStatus.Rejected;
        ReviewNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        ReviewedAt = DateTime.UtcNow;
    }
}
