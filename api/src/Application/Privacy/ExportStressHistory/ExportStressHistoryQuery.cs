using Application.Abstractions.Messaging;

namespace Application.Privacy.ExportStressHistory;

/// <summary>
/// Exports the current user's stress reading history as a CSV string.
/// </summary>
public sealed record ExportStressHistoryQuery : IQuery<string>;
