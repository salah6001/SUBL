using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Alerts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.ResolveAlert;

internal sealed class ResolveAlertCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<ResolveAlertCommand>
{
    public async Task<Result> Handle(
        ResolveAlertCommand request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure(AlertErrors.Forbidden);
        }

        StressAlert? alert = await context.StressAlerts
            .FirstOrDefaultAsync(a => a.Id == request.AlertId, cancellationToken);

        if (alert is null)
        {
            return Result.Failure(AlertErrors.NotFound(request.AlertId));
        }

        alert.Resolve();

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
