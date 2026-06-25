using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.GetStressSummary;

public sealed record GetStressSummaryQuery(DateTime From, DateTime To)
    : IQuery<StressSummaryResponse>;
