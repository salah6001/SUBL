using Application.Abstractions.Messaging;

namespace Application.Users.DeleteMyData;

/// <summary>
/// Permanently erases the current user's monitoring/analytics data (stress
/// sessions &amp; readings, surveys, habits, alerts, notifications). The account
/// itself (identity, profile, preferences) is kept so the user can keep using
/// the app with a clean slate.
/// </summary>
public sealed record DeleteMyDataCommand : ICommand;
