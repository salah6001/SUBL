using Application.Abstractions.Messaging;

namespace Application.DeviceSettings.UpdateMyPreferences;

public sealed record UpdateMyPreferencesCommand(
    string Theme,
    string Language,
    string Timezone,
    string DateFormat)
    : ICommand<PreferencesResponse>;
