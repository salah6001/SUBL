using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.AuditLogs.Common;
using Domain.AuditLogs;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.AuditLogs.GetActivityFeed;

internal sealed class GetActivityFeedQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetActivityFeedQuery, List<AuditLogListItemResponse>>
{
    public async Task<Result<List<AuditLogListItemResponse>>> Handle(
        GetActivityFeedQuery request,
        CancellationToken cancellationToken)
    {
        // Cross-user activity feed: restrict to super admins.
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<List<AuditLogListItemResponse>>(Error.Forbidden(
                "Admin.ActivityFeed.Forbidden",
                "You are not allowed to view the admin activity feed."));
        }

        List<AuditLogListItemResponse> feed = await context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Take(request.Limit)
            .Select(a => new AuditLogListItemResponse
            {
                Id = a.Id,
                UserId = a.UserId,
                UserEmail = a.UserEmail,
                ActionName = a.Action.ToString(),
                EntityType = a.EntityType,
                EntityName = a.EntityName,
                Description = a.Description,
                Timestamp = a.Timestamp
            })
            .ToListAsync(cancellationToken);

        return Result.Success(feed);
    }
}
