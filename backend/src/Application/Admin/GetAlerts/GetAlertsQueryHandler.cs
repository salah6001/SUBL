using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Domain.Alerts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.GetAlerts;

internal sealed class GetAlertsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetAlertsQuery, List<AlertResponse>>
{
    public async Task<Result<List<AlertResponse>>> Handle(
        GetAlertsQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<List<AlertResponse>>(AlertErrors.Forbidden);
        }

        IQueryable<StressAlert> query = context.StressAlerts.AsNoTracking();

        if (request.Status is { } status)
        {
            query = query.Where(a => a.Status == status);
        }

        if (request.Department is { } department)
        {
            query = query.Where(a => a.Department == department);
        }

        if (request.Severity is { } severity)
        {
            query = query.Where(a => a.Severity == severity);
        }

        List<StressAlert> alerts = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        var items = alerts
            .Select(a => new AlertResponse(
                a.Id,
                a.UserId,
                a.Department.ToString(),
                a.Category.ToString(),
                a.Severity.ToString(),
                a.Status.ToString(),
                a.Title,
                a.Message,
                a.CreatedAt,
                a.AcknowledgedAt,
                a.ResolvedAt))
            .ToList();

        return Result.Success(items);
    }
}
