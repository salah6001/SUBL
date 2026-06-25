namespace Application.DeviceSettings;

/// <summary>
/// The current user's UI preferences (theme, language, timezone, date format).
/// </summary>
public sealed record PreferencesResponse(
    string Theme,
    string Language,
    string Timezone,
    string DateFormat);
