using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Stress.GetCurrentStress;

/// <summary>
/// Returns the user's most recent stress reading (or HasData=false if none).
/// </summary>
public sealed record GetCurrentStressQuery : IQuery<CurrentStressResponse>;
