using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.WorkspaceRequests.Common;
using Domain.WorkspaceRequests;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.WorkspaceRequests.GetWorkspaceRequests;

internal sealed class GetWorkspaceRequestsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetWorkspaceRequestsQuery, IReadOnlyList<WorkspaceRequestResponse>>
{
    public async Task<Result<IReadOnlyList<WorkspaceRequestResponse>>> Handle(
        GetWorkspaceRequestsQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<IReadOnlyList<WorkspaceRequestResponse>>(
                WorkspaceRequestErrors.Forbidden);
        }

        IQueryable<WorkspaceRequest> query = context.WorkspaceRequests.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<WorkspaceRequestStatus>(request.Status, ignoreCase: true, out WorkspaceRequestStatus status))
        {
            query = query.Where(w => w.Status == status);
        }

        List<WorkspaceRequestResponse> items = await query
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WorkspaceRequestResponse(
                w.Id,
                w.CompanyName,
                w.ContactName,
                w.Email,
                w.Message,
                w.Status.ToString(),
                w.CreatedAt,
                w.ReviewedAt,
                w.ReviewNote))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<WorkspaceRequestResponse>>(items);
    }
}
