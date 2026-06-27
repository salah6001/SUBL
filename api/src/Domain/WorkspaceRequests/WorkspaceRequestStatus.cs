namespace Domain.WorkspaceRequests;

/// <summary>
/// Lifecycle state of a workspace (new-admin) request submitted from the
/// public landing page.
/// </summary>
public enum WorkspaceRequestStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}
