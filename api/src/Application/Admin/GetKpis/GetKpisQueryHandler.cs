using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Admin.Common;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Admin.GetKpis;

internal sealed class GetKpisQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<GetKpisQuery, AdminKpisResponse>
{
    /// <summary>A department is "at risk" if its average stress exceeds 60%.</summary>
    private const double RiskThreshold = 0.6;

    public async Task<Result<AdminKpisResponse>> Handle(
        GetKpisQuery request,
        CancellationToken cancellationToken)
    {
        if (!currentUserService.IsSuperAdmin)
        {
            return Result.Failure<AdminKpisResponse>(Error.Forbidden(
                "Admin.Kpis.Forbidden",
                "You are not allowed to view admin KPIs."));
        }

        DateTime toDate = request.To ?? DateTime.UtcNow;
        DateTime fromDate = request.From ?? toDate.AddDays(-30);

        int totalEmployees = await context.Users.CountAsync(cancellationToken);

        double averageScore = await context.StressReadings
            .Where(r => r.CreatedAt >= fromDate && r.CreatedAt <= toDate)
            .Select(r => (double?)r.Score)
            .AverageAsync(cancellationToken) ?? 0;

        double overallStressPercent = Math.Round(averageScore * 100, 1);
        double wellnessScore = Math.Round(100 - overallStressPercent, 1);

        // Average stress per department over the window, then count at-risk teams.
        var deptRows = await (
            from reading in context.StressReadings.AsNoTracking()
            join profile in context.UserProfiles.AsNoTracking()
                on reading.UserId equals profile.UserId
            where reading.CreatedAt >= fromDate && reading.CreatedAt <= toDate
            select new
            {
                profile.Department,
                reading.Score
            }).ToListAsync(cancellationToken);

        int teamsAtRisk = deptRows
            .GroupBy(r => r.Department)
            .Count(g => g.Average(r => r.Score) > RiskThreshold);

        var response = new AdminKpisResponse(
            wellnessScore,
            teamsAtRisk,
            totalEmployees,
            overallStressPercent,
            fromDate,
            toDate);

        return Result.Success(response);
    }
}
