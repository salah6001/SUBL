using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.GetTrends;

/// <summary>
/// Returns time-bucketed stress trends for charting (daily by default).
/// </summary>
public sealed record GetTrendsQuery(
    DateTime From,
    DateTime To,
    string Granularity = "Hour") : IQuery<List<StressTrendPoint>>;
