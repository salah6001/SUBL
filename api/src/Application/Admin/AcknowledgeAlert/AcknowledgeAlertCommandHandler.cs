using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Alerts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.AcknowledgeAlert;

internal sealed class AcknowledgeAlertCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<AcknowledgeAlertCommand>
{
    public async Task<Result> Handle(
        AcknowledgeAlertCommand request,
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

        alert.Acknowledge();

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
