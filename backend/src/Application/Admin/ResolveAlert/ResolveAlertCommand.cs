using Application.Abstractions.Messaging;

namespace Application.Admin.ResolveAlert;

public sealed record ResolveAlertCommand(Guid AlertId) : ICommand;
