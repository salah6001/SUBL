using Application.Abstractions.Messaging;

namespace Application.DeviceSettings.GetMyPreferences;

public sealed record GetMyPreferencesQuery : IQuery<PreferencesResponse>;
