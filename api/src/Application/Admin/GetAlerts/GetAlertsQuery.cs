using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Domain.Alerts;
using Domain.Common;

namespace Application.Admin.GetAlerts;

/// <summary>
/// Lists admin stress alerts, optionally filtered by status / department / severity.
/// </summary>
public sealed record GetAlertsQuery(
    AlertStatus? Status = null,
    Department? Department = null,
    AlertSeverity? Severity = null,
    int Limit = 100) : IQuery<List<AlertResponse>>;
