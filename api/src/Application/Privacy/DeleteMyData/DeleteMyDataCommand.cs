using Application.Abstractions.Messaging;

namespace Application.Privacy.DeleteMyData;

/// <summary>
/// Permanently (hard) deletes the current user's collected data: stress
/// readings, keyboard metrics, sessions, devices, habits and notifications.
/// The user account, profile and roles are kept.
/// </summary>
public sealed record DeleteMyDataCommand : ICommand;
