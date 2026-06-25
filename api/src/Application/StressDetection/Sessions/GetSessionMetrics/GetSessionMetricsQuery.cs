using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Sessions.GetSessionMetrics;

/// <summary>
/// Returns aggregated metrics for a single session, including the distribution
/// of its readings across stress levels.
/// </summary>
public sealed record GetSessionMetricsQuery(
    Guid SessionId) : IQuery<SessionMetricsResponse>;
