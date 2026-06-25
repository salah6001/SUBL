using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Sessions.GetSessionById;

/// <summary>
/// Query to get a single session including its readings.
/// </summary>
public sealed record GetSessionByIdQuery(Guid SessionId) : IQuery<SessionDetailResponse>;
