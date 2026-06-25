using Application.Abstractions.Messaging;
using Application.Admin.Common;

namespace Application.Admin.GetKpis;

/// <summary>
/// Organization-wide wellbeing KPIs. Defaults to the last 30 days.
/// </summary>
public sealed record GetKpisQuery(
    DateTime? From = null,
    DateTime? To = null) : IQuery<AdminKpisResponse>;
