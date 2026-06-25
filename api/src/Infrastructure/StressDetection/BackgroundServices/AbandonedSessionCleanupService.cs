using Application.Abstractions.Data;
using Application.Abstractions.Repositories;
using Domain.StressDetection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.StressDetection.BackgroundServices;

/// <summary>
/// Periodically marks active/paused sessions as Abandoned if the agent has not
/// reported activity within a timeout window. Prevents the "active session lock"
/// from blocking new sessions if the agent crashes or loses connectivity.
/// </summary>
internal sealed class AbandonedSessionCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<AbandonedSessionCleanupService> logger)
    : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan AbandonAfter = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AbandonedSessionCleanupService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while cleaning up abandoned stress sessions");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task CleanupOnceAsync(CancellationToken cancellationToken)
    {
        using IServiceScope scope = scopeFactory.CreateScope();
        IStressSessionRepository sessionRepository = scope.ServiceProvider.GetRequiredService<IStressSessionRepository>();
        IUnitOfWork unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        DateTime cutoff = DateTime.UtcNow - AbandonAfter;
        List<StressSession> stale = await sessionRepository.GetStaleActiveAsync(cutoff, cancellationToken);

        if (stale.Count == 0)
        {
            return;
        }

        foreach (StressSession session in stale)
        {
            session.MarkAsAbandoned();
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Marked {Count} stress session(s) as abandoned (last activity older than {Cutoff:o})",
            stale.Count,
            cutoff);
    }
}
