using Application.Abstractions.Messaging;

namespace Application.StressDetection.Sessions.EndSession;

/// <summary>
/// Command to end an active stress monitoring session.
/// </summary>
public sealed record EndSessionCommand(
    Guid SessionId,
    string? Reason) : ICommand;
