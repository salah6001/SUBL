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
    /// The user that registered this device (the desktop agent's service identity).
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// The user who has <em>claimed</em> this machine's data stream, if any.
    /// When set, sessions and stress readings produced by this device are
    /// attributed to this user instead of the registrant. This lets any
    /// logged-in user point the running agent at their own dashboard without
    /// re-deploying the agent with different credentials.
    /// </summary>
    public Guid? ClaimedByUserId { get; private set; }

    /// <summary>
    /// The user that owns the data this device produces: the claimer when the
    /// device has been claimed, otherwise the registrant.
    /// </summary>
    public Guid OwnerId => ClaimedByUserId ?? UserId;

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

    /// <summary>
    /// How recently the agent must have reported in for the device to count as
    /// "online". <see cref="IsActive"/> is only an enabled/registered flag, so
    /// liveness is derived from <see cref="LastSeenAt"/> against this window.
    /// </summary>
    public static readonly TimeSpan OnlineWindow = TimeSpan.FromMinutes(10);

    /// <summary>
    /// True when the device is enabled and has reported within
    /// <see cref="OnlineWindow"/> — i.e. an agent is currently running on it.
    /// </summary>
    public bool IsOnline =>
        IsActive &&
        LastSeenAt.HasValue &&
        DateTime.UtcNow - LastSeenAt.Value <= OnlineWindow;

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

    /// <summary>
    /// Point this device's data stream at <paramref name="userId"/>. Subsequent
    /// sessions and readings will be attributed to that user. A no-op if the
    /// device is already claimed by the same user.
    /// </summary>
    public void Claim(Guid userId)
    {
        if (ClaimedByUserId == userId)
        {
            return;
        }

        ClaimedByUserId = userId;
    }

    /// <summary>
    /// Release the claim so data falls back to the registrant.
    /// </summary>
    public void Unclaim()
    {
        ClaimedByUserId = null;
    }
}
