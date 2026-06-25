using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using SharedKernel;

namespace Application.StressDetection.Sessions.GetSessions;

/// <summary>
/// Query to get the current user's session history with pagination.
/// </summary>
public sealed record GetSessionsQuery(
    int Page = 1,
    int PageSize = 20,
    DateTime? From = null,
    DateTime? To = null) : IQuery<PagedResult<SessionResponse>>;
