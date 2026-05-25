using Application.Abstractions.Repositories;
using Domain.StressDetection;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.StressDetection.Repositories;

internal sealed class DeviceRepository(ApplicationDbContext context) : IDeviceRepository
{
    public Task<Device?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Devices.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

    public Task<Device?> GetByIdForUserAsync(
        Guid id,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.Devices.FirstOrDefaultAsync(
            d => d.Id == id && d.UserId == userId,
            cancellationToken);

    public Task<Device?> GetByFingerprintAsync(
        Guid userId,
        string fingerprint,
        CancellationToken cancellationToken = default) =>
        context.Devices.FirstOrDefaultAsync(
            d => d.UserId == userId && d.DeviceFingerprint == fingerprint,
            cancellationToken);

    public Task<List<Device>> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        context.Devices
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.LastSeenAt ?? d.CreatedAt)
            .ToListAsync(cancellationToken);

    public void Add(Device device) => context.Devices.Add(device);

    public void Remove(Device device) => context.Devices.Remove(device);
}
