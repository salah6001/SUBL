using Application.Abstractions.Messaging;
using SharedKernel;

namespace Application.Notifications.UpdatePreferences;

/// <summary>
/// Command to update user's notification preferences. All fields are optional —
/// only the ones provided (non-null) are changed, so the client can PATCH a
/// single toggle without resetting the others.
/// </summary>
public sealed record UpdatePreferencesCommand(
bool? InAppEnabled,
bool? EmailEnabled,
bool? PushEnabled,
bool? SmsEnabled,
bool? EmailDigestEnabled,
string? EmailDigestFrequency,
TimeOnly? EmailDigestTime,
bool? QuietHoursEnabled,
TimeOnly? QuietHoursStart,
TimeOnly? QuietHoursEnd,
string? QuietHoursTimezone) : ICommand;
