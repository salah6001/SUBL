using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Sessions.GetActiveSession;

/// <summary>
/// Query to get the current user's active session, if one exists.
/// </summary>
public sealed record GetActiveSessionQuery : IQuery<SessionResponse?>;
