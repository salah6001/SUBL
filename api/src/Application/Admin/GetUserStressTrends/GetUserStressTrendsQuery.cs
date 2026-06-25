using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.Admin.GetUserStressTrends;

public sealed record GetUserStressTrendsQuery(
    Guid TargetUserId,
    DateTime From,
    DateTime To,
    string Granularity = "Day") : IQuery<List<StressTrendPoint>>;
