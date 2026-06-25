using System.Net.WebSockets;

namespace Application.Abstractions.RealTime;

public interface IStressStreamHub
{
    /// <summary>
    /// Registers the socket, then blocks until the client disconnects.
    /// </summary>
    Task ServeClientAsync(Guid userId, WebSocket socket, CancellationToken ct);

    /// <summary>
    /// Pushes a reading to every WebSocket currently connected for this user.
    /// </summary>
    Task BroadcastAsync(Guid userId, StressStreamMessage message, CancellationToken ct = default);
}

public sealed record StressStreamMessage(
    double Score,
    string Level,
    double Confidence,
    DateTime At);
