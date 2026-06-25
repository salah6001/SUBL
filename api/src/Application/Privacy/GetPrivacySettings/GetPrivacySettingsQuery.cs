using Application.Abstractions.Messaging;
using Application.Privacy.Common;

namespace Application.Privacy.GetPrivacySettings;

public sealed record GetPrivacySettingsQuery : IQuery<PrivacySettingsResponse>;
