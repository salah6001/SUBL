using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.GetDepartmentStress;

/// <summary>
/// Returns stress aggregated per organizational department over a window.
/// Admin analytics view; restricted to super admins.
/// </summary>
public sealed record GetDepartmentStressQuery(
    DateTime From,
    DateTime To) : IQuery<DepartmentStressResponse>;
