using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using SharedKernel;

namespace Application.StressDetection.Stress.GetReadings;

/// <summary>
/// Paginated stress readings for the current user (optionally filtered by session and date range).
/// </summary>
public sealed record GetReadingsQuery(
    int Page = 1,
    int PageSize = 50,
    DateTime? From = null,
    DateTime? To = null,
    Guid? SessionId = null) : IQuery<PagedResult<StressReadingResponse>>;
