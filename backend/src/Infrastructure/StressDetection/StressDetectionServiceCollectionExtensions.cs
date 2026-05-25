using Application.Abstractions.Repositories;
using Application.Abstractions.StressDetection;
using Infrastructure.StressDetection.BackgroundServices;
using Infrastructure.StressDetection.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.StressDetection;

/// <summary>
/// DI registration for the Stress Detection module. Plugged in from
/// <c>Infrastructure.DependencyInjection</c>.
/// </summary>
internal static class StressDetectionServiceCollectionExtensions
{
    public static IServiceCollection AddStressDetectionServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Repositories
        services.AddScoped<IDeviceRepository, DeviceRepository>();
        services.AddScoped<IStressSessionRepository, StressSessionRepository>();
        services.AddScoped<IStressReadingRepository, StressReadingRepository>();

        // ML service settings
        services.Configure<StressDetectionSettings>(
            configuration.GetSection(StressDetectionSettings.SectionName));

        // Typed HttpClient for the ML service
        services.AddHttpClient<IStressDetectionService, StressDetectionHttpService>((sp, client) =>
        {
            StressDetectionSettings opts = sp
                .GetRequiredService<Microsoft.Extensions.Options.IOptions<StressDetectionSettings>>()
                .Value;

            if (!string.IsNullOrWhiteSpace(opts.BaseUrl))
            {
                client.BaseAddress = new Uri(opts.BaseUrl);
            }

            client.Timeout = TimeSpan.FromSeconds(opts.TimeoutSeconds <= 0 ? 10 : opts.TimeoutSeconds);

            if (!string.IsNullOrWhiteSpace(opts.ApiKey))
            {
                client.DefaultRequestHeaders.Add("X-API-Key", opts.ApiKey);
            }
        });

        // Background cleanup of abandoned sessions
        services.AddHostedService<AbandonedSessionCleanupService>();

        return services;
    }
}
