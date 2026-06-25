using System.Globalization;
using Application.Abstractions.Data;
using Domain.Alerts;
using Domain.Common;
using Domain.StressDetection;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Alerts.EventHandlers;

/// <summary>
/// Raises an admin-facing <see cref="StressAlert"/> whenever a reading is flagged
/// High or Critical, so admins can track and resolve wellbeing issues.
/// </summary>
internal sealed class HighStressAlertHandler(IApplicationDbContext context)
    : IDomainEventHandler<HighStressDetectedDomainEvent>
{
    public async Task Handle(
        HighStressDetectedDomainEvent domainEvent,
        CancellationToken cancellationToken)
    {
        Department department = await context.UserProfiles
            .AsNoTracking()
            .Where(p => p.UserId == domainEvent.UserId)
            .Select(p => p.Department)
            .FirstOrDefaultAsync(cancellationToken);

        bool isCritical = domainEvent.Level == StressLevel.Critical;

        string scorePercent = Math.Round(domainEvent.Score * 100)
            .ToString(CultureInfo.InvariantCulture);

        var alert = StressAlert.Create(
            domainEvent.UserId,
            department,
            isCritical ? AlertCategory.CriticalStress : AlertCategory.HighStress,
            isCritical ? AlertSeverity.Critical : AlertSeverity.High,
            isCritical ? "Critical stress detected" : "High stress detected",
            "Stress score " + scorePercent + "% detected for the user.");

        context.StressAlerts.Add(alert);

        await context.SaveChangesAsync(cancellationToken);
    }
}
