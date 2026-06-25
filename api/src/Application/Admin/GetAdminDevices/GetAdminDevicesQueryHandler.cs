using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Domain.Alerts;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.GetAdminDevices;

internal sealed class GetAdminDevicesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetAdminDevicesQuery, List<AdminDeviceResponse>>
{
    public async Task<Result<List<AdminDeviceResponse>>> Handle(
        GetAdminDevicesQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<List<AdminDeviceResponse>>(AlertErrors.Forbidden);
        }

        // Recent stress aggregates per user to derive the stress signal
        DateTime since = DateTime.UtcNow.AddHours(-24);
        Dictionary<Guid, double> recentAvg = await context.StressReadings
            .AsNoTracking()
            .Where(r => r.CreatedAt >= since)
            .GroupBy(r => r.UserId)
            .Select(g => new { UserId = g.Key, Avg = g.Average(r => r.Score) })
            .ToDictionaryAsync(x => x.UserId, x => x.Avg, cancellationToken);

        var devices = await context.Devices
            .AsNoTracking()
            .Join(context.Users,
                d => d.UserId,
                u => u.Id,
                (d, u) => new { Device = d, User = u })
            .GroupJoin(context.UserProfiles,
                du => du.User.Id,
                p => p.UserId,
                (du, profiles) => new { du.Device, du.User, Profile = profiles.FirstOrDefault() })
            .ToListAsync(cancellationToken);

        // Email lookup for resolving the claimer (data owner) of each device.
        Dictionary<Guid, string> emailById = await context.Users
            .AsNoTracking()
            .ToDictionaryAsync(u => u.Id, u => u.Email, cancellationToken);

        var response = devices
            .Where(x => request.IncludeRevoked || x.Device.IsActive)
            .OrderByDescending(x => x.Device.LastSeenAt ?? x.Device.CreatedAt)
            .Select(x =>
            {
                recentAvg.TryGetValue(x.Device.UserId, out double avg);
                string signal = avg switch
                {
                    >= 0.70 => "critical",
                    >= 0.50 => "high",
                    >= 0.30 => "moderate",
                    > 0     => "low",
                    _       => "low"
                };

                return new AdminDeviceResponse(
                    x.Device.Id,
                    x.Device.DeviceName,
                    x.Device.UserId,
                    x.User.Email,
                    x.Profile?.Department.ToString() ?? "—",
                    x.Device.Platform.ToString(),
                    x.Device.OsVersion,
                    x.Device.AgentVersion,
                    x.Device.LastIpAddress,
                    x.Device.IsActive,
                    x.Device.IsOnline,
                    x.Device.LastSeenAt,
                    x.Device.CreatedAt,
                    x.Device.RevokedAt,
                    signal,
                    x.Device.ClaimedByUserId,
                    x.Device.ClaimedByUserId is Guid cid && emailById.TryGetValue(cid, out string? ce) ? ce : null);
            })
            .ToList();

        return Result.Success(response);
    }
}
