using Domain.StressDetection;

namespace Application.Abstractions.Repositories;

/// <summary>
/// Repository interface for StressSession operations.
/// </summary>
public interface IStressSessionRepository
{
    /// <summary>
    /// Gets a session by ID.
    /// </summary>
    Task<StressSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a session by ID, but only if it belongs to the given user.
    /// </summary>
    Task<StressSession?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the user's currently-active session if any (Active or Paused status).
    /// </summary>
    Task<StressSession?> GetActiveForUserAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the currently-active session for a device if any (Active or Paused),
    /// regardless of which user owns it. Used when re-claiming a device.
    /// </summary>
    Task<StressSession?> GetActiveForDeviceAsync(Guid deviceId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns paginated session history for a user.
    /// </summary>
    Task<(List<StressSession> Items, int TotalCount)> GetPaginatedAsync(
        Guid userId,
        int page,
        int pageSize,
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns sessions whose <c>LastActivityAt</c> is older than <paramref name="olderThan"/>
    /// and that are still in Active or Paused state.
    /// Used by the abandoned-session cleanup background job.
    /// </summary>
    Task<List<StressSession>> GetStaleActiveAsync(
        DateTime olderThan,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new session.
    /// </summary>
    void Add(StressSession session);

    /// <summary>
    /// Updates a session.
    /// </summary>
    void Update(StressSession session);
}
