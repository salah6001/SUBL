using Application.Abstractions.Messaging;

namespace Application.StressDetection.Sessions.ResumeSession;

public sealed record ResumeSessionCommand(Guid SessionId) : ICommand;
