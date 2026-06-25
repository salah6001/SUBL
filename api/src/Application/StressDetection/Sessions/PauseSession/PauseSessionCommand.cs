using Application.Abstractions.Messaging;

namespace Application.StressDetection.Sessions.PauseSession;

public sealed record PauseSessionCommand(Guid SessionId) : ICommand;
