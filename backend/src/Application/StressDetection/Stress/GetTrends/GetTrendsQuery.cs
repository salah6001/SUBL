using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.GetTrends;

/// <summary>
/// Returns time-bucketed stress trends for charting (daily by default).
/// When <see cref="UserId"/> is supplied and differs from the caller, the
/// trends are returned for that user (admin/analytics view); otherwise the
/// caller's own trends are returned.
/// </summary>
public sealed record GetTrendsQuery(
    DateTime From,
    DateTime To,
    string Granularity = "Hour",
    Guid? UserId = null) : IQuery<List<StressTrendPoint>>;
