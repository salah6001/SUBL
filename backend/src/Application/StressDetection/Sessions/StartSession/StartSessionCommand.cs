using Application.Abstractions.Messaging;

namespace Application.StressDetection.Sessions.StartSession;

/// <summary>
/// Command issued by the desktop agent to start a new monitoring session.
/// </summary>
public sealed record StartSessionCommand(
    Guid DeviceId,
    string? Notes) : ICommand<Guid>;
