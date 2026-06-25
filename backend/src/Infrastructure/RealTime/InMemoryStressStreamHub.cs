using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Abstractions.RealTime;
using Microsoft.Extensions.Logging;

namespace Infrastructure.RealTime;

/// <summary>
/// In-process WebSocket hub that fans out stress readings to connected browser clients.
/// Registered as singleton so it outlives any request scope.
/// </summary>
internal sealed class InMemoryStressStreamHub(ILogger<InMemoryStressStreamHub> logger)
    : IStressStreamHub
{
    private readonly ConcurrentDictionary<Guid, ConcurrentBag<WebSocket>> _sockets = new();

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task ServeClientAsync(Guid userId, WebSocket socket, CancellationToken ct)
    {
        ConcurrentBag<WebSocket> bag = _sockets.GetOrAdd(userId, _ => new ConcurrentBag<WebSocket>());
        bag.Add(socket);

        logger.LogDebug("WebSocket connected for user {UserId}", userId);

        byte[] buffer = new byte[1024];
        try
        {
            while (socket.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                WebSocketReceiveResult result = await socket.ReceiveAsync(buffer, ct);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    break;
                }
            }
        }
        catch (OperationCanceledException ex)
        {
            logger.LogTrace(ex, "WebSocket stream cancelled for user {UserId}", userId);
        }
        catch (WebSocketException ex)
        {
            logger.LogDebug(ex, "WebSocket closed unexpectedly for user {UserId}", userId);
        }
        finally
        {
            if (socket.State == WebSocketState.Open)
            {
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Server closing", CancellationToken.None);
            }

            logger.LogDebug("WebSocket disconnected for user {UserId}", userId);
        }
    }

    public async Task BroadcastAsync(Guid userId, StressStreamMessage message, CancellationToken ct = default)
    {
        if (!_sockets.TryGetValue(userId, out ConcurrentBag<WebSocket>? bag) || bag.IsEmpty)
        {
            return;
        }

        byte[] payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message, JsonOptions));
        var frame = new ArraySegment<byte>(payload);

        var dead = new List<WebSocket>();

        foreach (WebSocket ws in bag)
        {
            if (ws.State != WebSocketState.Open)
            {
                dead.Add(ws);
                continue;
            }

            try
            {
                await ws.SendAsync(frame, WebSocketMessageType.Text, true, ct);
            }
            catch (Exception ex) when (ex is WebSocketException or OperationCanceledException)
            {
                dead.Add(ws);
            }
        }

        // Remove closed sockets. ConcurrentBag doesn't support remove, so swap the bag.
        if (dead.Count > 0)
        {
            var alive = bag.Where(ws => !dead.Contains(ws)).ToList();
            var newBag = new ConcurrentBag<WebSocket>(alive);
            _sockets.TryUpdate(userId, newBag, bag);
        }
    }
}
