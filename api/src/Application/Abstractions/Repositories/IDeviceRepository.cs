using Domain.StressDetection;

namespace Application.Abstractions.Repositories;

/// <summary>
/// Repository interface for Device entity operations.
/// </summary>
public interface IDeviceRepository
{
    /// <summary>
    /// Gets a device by ID.
    /// </summary>
    Task<Device?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a device by ID, but only if it is owned by the given user.
    /// </summary>
    Task<Device?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Looks up a device for a user by stable hardware fingerprint.
    /// </summary>
    Task<Device?> GetByFingerprintAsync(Guid userId, string fingerprint, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns all devices belonging to a user.
    /// </summary>
    Task<List<Device>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns all active devices across all users. Used to present the list of
    /// machines a user may claim (point at their own dashboard).
    /// </summary>
    Task<List<Device>> GetAllActiveAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new device.
    /// </summary>
    void Add(Device device);

    /// <summary>
    /// Removes a device.
    /// </summary>
    void Remove(Device device);
}
