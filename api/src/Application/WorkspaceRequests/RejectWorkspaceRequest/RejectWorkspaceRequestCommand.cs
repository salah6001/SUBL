using Application.Abstractions.Messaging;

namespace Application.WorkspaceRequests.RejectWorkspaceRequest;

public sealed record RejectWorkspaceRequestCommand(Guid RequestId, string? Note) : ICommand;
