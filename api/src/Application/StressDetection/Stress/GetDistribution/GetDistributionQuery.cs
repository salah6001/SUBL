using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.GetDistribution;

/// <summary>
/// Returns the distribution of the user's stress readings across levels
/// (Low/Moderate/High/Critical) for pie/bar charting.
/// </summary>
public sealed record GetDistributionQuery(
    DateTime From,
    DateTime To) : IQuery<StressDistributionResponse>;
