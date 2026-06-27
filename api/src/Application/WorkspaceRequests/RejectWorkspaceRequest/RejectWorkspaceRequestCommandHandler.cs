using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.WorkspaceRequests;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.WorkspaceRequests.RejectWorkspaceRequest;

internal sealed class RejectWorkspaceRequestCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : ICommandHandler<RejectWorkspaceRequestCommand>
{
    public async Task<Result> Handle(
        RejectWorkspaceRequestCommand request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure(WorkspaceRequestErrors.Forbidden);
        }

        WorkspaceRequest? workspaceRequest = await context.WorkspaceRequests
            .FirstOrDefaultAsync(w => w.Id == request.RequestId, cancellationToken);

        if (workspaceRequest is null)
        {
            return Result.Failure(WorkspaceRequestErrors.NotFound(request.RequestId));
        }

        if (workspaceRequest.Status != WorkspaceRequestStatus.Pending)
        {
            return Result.Failure(WorkspaceRequestErrors.NotPending);
        }

        workspaceRequest.Reject(request.Note);

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
