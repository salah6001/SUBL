using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.StressDetection.Stress.GetDepartmentStress;

internal sealed class GetDepartmentStressQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetDepartmentStressQuery, DepartmentStressResponse>
{
    public async Task<Result<DepartmentStressResponse>> Handle(
        GetDepartmentStressQuery request,
        CancellationToken cancellationToken)
    {
        // Cross-user analytics: restrict to super admins.
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<DepartmentStressResponse>(Error.Forbidden(
                "Stress.Departments.Forbidden",
                "You are not allowed to view department-level stress analytics."));
        }

        // Drive the benchmark from the *user population* so it matches the
        // Users tab: every department that actually has users appears, even if
        // those users have no stress readings yet (shown as 0). Departments
        // with no users never appear. (Previously this grouped readings only,
        // so a department whose users hadn't generated data silently vanished
        // and only departments with seeded readings showed up.)
        var people = await context.UserProfiles.AsNoTracking()
            .Select(p => new { p.UserId, p.Department })
            .ToListAsync(cancellationToken);

        var readings = await context.StressReadings.AsNoTracking()
            .Where(r => r.CreatedAt >= request.From && r.CreatedAt <= request.To)
            .Select(r => new { r.UserId, r.Score })
            .ToListAsync(cancellationToken);

        var deptByUser = people
            .GroupBy(p => p.UserId)
            .ToDictionary(g => g.Key, g => g.First().Department);

        var scoresByDept = readings
            .Where(r => deptByUser.ContainsKey(r.UserId))
            .GroupBy(r => deptByUser[r.UserId])
            .ToDictionary(g => g.Key, g => g.Select(r => r.Score).ToList());

        var departments = people
            .GroupBy(p => p.Department)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                List<double> scores = scoresByDept.TryGetValue(g.Key, out List<double>? s) ? s : [];
                return new DepartmentStressSlice(
                    Department: g.Key.ToString(),
                    UserCount: g.Select(p => p.UserId).Distinct().Count(),
                    ReadingsCount: scores.Count,
                    AverageStressScore: scores.Count > 0 ? scores.Average() : 0,
                    PeakStressScore: scores.Count > 0 ? scores.Max() : 0);
            })
            .ToList();

        var response = new DepartmentStressResponse(
            request.From,
            request.To,
            departments);

        return Result.Success(response);
    }
}
