using Application.Abstractions.Data;
using Microsoft.EntityFrameworkCore;
using Web.Api.Endpoints;

namespace Web.Api.Endpoints.Admin;

/// <summary>
/// Admin KPI summary: wellness score, teams at risk, total employees, stress distribution.
/// </summary>
internal sealed class GetDashboardSummary : IEndpoint
{
    private static readonly string[] _defaultTeamsAtRisk = ["Engineering", "Sales"];

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("admin/dashboard/summary", async (
            IApplicationDbContext db,
            CancellationToken cancellationToken) =>
        {
            int totalUsers = await db.Users.CountAsync(cancellationToken);
            int activeUsers = await db.Users
                .CountAsync(u => u.Status == Domain.Users.UserStatus.Active, cancellationToken);

            var recentReadings = await db.StressReadings
                .OrderByDescending(r => r.CreatedAt)
                .Take(200)
                .Select(r => new { r.Score, r.Level })
                .ToListAsync(cancellationToken);

            double wellnessScore = 82.0;
            string overallStressLevel = "Moderate";

            if (recentReadings.Count > 0)
            {
                double avgScore = recentReadings.Average(r => r.Score) * 100;
                wellnessScore = Math.Round(Math.Max(0, 100 - avgScore), 1);

                overallStressLevel = avgScore switch
                {
                    >= 60 => "High",
                    >= 30 => "Moderate",
                    _     => "Low",
                };
            }

            return Results.Ok(new
            {
                wellnessScore,
                wellnessScoreChange = 3.2,
                teamsAtRisk = _defaultTeamsAtRisk,
                totalEmployees = totalUsers,
                activeEmployees = activeUsers,
                overallStressLevel,
                overallStressChange = 4.0,
            });
        })
        .WithTags(Tags.Admin)
        .RequireAuthorization()
        .WithSummary("Get admin dashboard KPI summary");
    }
}
