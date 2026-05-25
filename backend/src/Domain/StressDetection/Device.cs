using Domain.Users;
using SharedKernel;

namespace Domain.StressDetection;

/// <summary>
/// Represents a registered desktop agent device that can collect keyboard stress data.
/// </summary>
public sealed class Device : Entity
{
    public Guid Id { get; private set; }

    /// <summary>
    /// The user this device belongs to.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// Friendly name for display (e.g. "Khaled's Laptop").
    /// </summary>
    public string DeviceName { get; private set; } = string.Empty;

    /// <summary>
    /// Stable hardware/software fingerprint provided by the agent.
    /// Used to prevent duplicate registrations from the same machine.
    /// </summary>
    public string DeviceFingerprint { get; private set; } = string.Empty;

    /// <summary>
    /// Operating system platform.
    /// </summary>
    public DevicePlatform Platform { get; private set; }

    /// <summary>
    /// Operating system version (free-form string from the agent).
    /// </summary>
    public string? OsVersion { get; private set; }

    /// <summary>
    /// Version of the desktop agent software.
    /// </summary>
    public string? AgentVersion { get; private set; }

    /// <summary>
    /// Whether the device is currently allowed to start sessions and submit data.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Last time the agent reported in (started a session, submitted data, or pinged).
    /// </summary>
    public DateTime? LastSeenAt { get; private set; }

    /// <summary>
    /// Last IP address seen from the agent.
    /// </summary>
    public string? LastIpAddress { get; private set; }

    /// <summary>
    /// When the device was first registered.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// When the device was revoked (if applicable).
    /// </summary>
    public DateTime? RevokedAt { get; private set; }

    // Navigation
    public User? User { get; init; }

    private Device()
    {
    }

    public static Device Register(
        Guid userId,
        string deviceName,
        string deviceFingerprint,
        DevicePlatform platform,
        string? osVersion = null,
        string? agentVersion = null,
        string? ipAddress = null)
    {
        var device = new Device
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DeviceName = deviceName,
            DeviceFingerprint = deviceFingerprint,
            Platform = platform,
            OsVersion = osVersion,
            AgentVersion = agentVersion,
            IsActive = true,
            LastSeenAt = DateTime.UtcNow,
            LastIpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        };

        device.Raise(new DeviceRegisteredDomainEvent(device.Id, userId));

        return device;
    }

    public void UpdateAgentInfo(string? osVersion, string? agentVersion)
    {
        OsVersion = osVersion;
        AgentVersion = agentVersion;
    }

    public void UpdateLastSeen(string? ipAddress = null)
    {
        LastSeenAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(ipAddress))
        {
            LastIpAddress = ipAddress;
        }
    }

    public void Rename(string newName)
    {
        DeviceName = newName;
    }

    public void Revoke()
    {
        if (!IsActive)
        {
            return;
        }

        IsActive = false;
        RevokedAt = DateTime.UtcNow;

        Raise(new DeviceRevokedDomainEvent(Id, UserId));
    }

    public void Reactivate()
    {
        IsActive = true;
        RevokedAt = null;
    }
}
