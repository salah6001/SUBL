using System.Globalization;
using System.Text;
using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Privacy.ExportStressHistory;

internal sealed class ExportStressHistoryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService)
    : IQueryHandler<ExportStressHistoryQuery, string>
{
    public async Task<Result<string>> Handle(
        ExportStressHistoryQuery request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        var rows = await context.StressReadings
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.SessionId,
                r.Score,
                r.Level,
                r.Confidence,
                r.ModelVersion,
                r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Id,SessionId,Score,Level,Confidence,ModelVersion,CreatedAt");

        foreach (var r in rows)
        {
            sb.Append(r.Id).Append(',')
                .Append(r.SessionId).Append(',')
                .Append(r.Score.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(r.Level).Append(',')
                .Append(r.Confidence.ToString(CultureInfo.InvariantCulture)).Append(',')
                .Append(EscapeCsv(r.ModelVersion)).Append(',')
                .Append(r.CreatedAt.ToString("o", CultureInfo.InvariantCulture))
                .Append('\n');
        }

        return Result.Success(sb.ToString());
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        if (value.Contains(',', StringComparison.Ordinal) ||
            value.Contains('"', StringComparison.Ordinal) ||
            value.Contains('\n', StringComparison.Ordinal))
        {
            return $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
        }

        return value;
    }
}
