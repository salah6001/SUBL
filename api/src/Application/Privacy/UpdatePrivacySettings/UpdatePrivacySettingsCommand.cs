using Application.Abstractions.Messaging;
using Application.Privacy.Common;

namespace Application.Privacy.UpdatePrivacySettings;

public sealed record UpdatePrivacySettingsCommand(
    bool KeystrokeDynamics,
    bool SentimentAnalysis,
    bool ProductAnalytics,
    bool EmployerDataSharing) : ICommand<PrivacySettingsResponse>;
