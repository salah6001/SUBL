using Application.Abstractions.Messaging;
using Application.WorkspaceRequests.Common;

namespace Application.WorkspaceRequests.GetWorkspaceRequests;

/// <summary>
/// Admin query listing workspace requests, optionally filtered by status.
/// </summary>
public sealed record GetWorkspaceRequestsQuery(string? Status)
    : IQuery<IReadOnlyList<WorkspaceRequestResponse>>;
