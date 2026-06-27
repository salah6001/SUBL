using Application.Abstractions.Messaging;

namespace Application.WorkspaceRequests.CreateWorkspaceRequest;

/// <summary>
/// Public command (no authentication) submitted from the landing page to
/// request a Subl workspace. Collects contact details only — never a password.
/// </summary>
public sealed record CreateWorkspaceRequestCommand(
    string CompanyName,
    string ContactName,
    string Email,
    string? Message) : ICommand<Guid>;
