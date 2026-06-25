using Application.Abstractions.Messaging;
using Application.AuditLogs.Common;
using SharedKernel;

namespace Application.AuditLogs.GetActivityFeed;

/// <summary>
/// Returns the most recent audit-log entries as an admin activity feed.
/// </summary>
public sealed record GetActivityFeedQuery(
    int Limit = 50) : IQuery<List<AuditLogListItemResponse>>;
