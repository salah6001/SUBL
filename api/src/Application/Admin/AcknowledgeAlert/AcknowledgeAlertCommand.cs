using Application.Abstractions.Messaging;

namespace Application.Admin.AcknowledgeAlert;

public sealed record AcknowledgeAlertCommand(Guid AlertId) : ICommand;
