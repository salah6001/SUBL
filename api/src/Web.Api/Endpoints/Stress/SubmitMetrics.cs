using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.SubmitMetrics;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

/// <summary>
/// Endpoint that the desktop agent calls every batch window with the
/// 6 keyboard features. Maps the JSON body to a <see cref="SubmitMetricsCommand"/>,
/// which forwards the features to the Python ML service and persists the
/// resulting stress reading.
/// </summary>
internal sealed class SubmitMetrics : IEndpoint
{
    /// <summary>
    /// Wire format from the desktop agent. Field names match the agent's
    /// camelCase JSON exactly.
    /// </summary>
    public sealed record Request(
        double MeanDwell,
        double MedianFlight,
        double CvFlight,
        double MeanDelFreq,
        double MeanTotTime,
        int NKeys,
        int? DeleteCount,
        DateTimeOffset? CapturedAt);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("stress-sessions/{sessionId:guid}/metrics", async (
            Guid sessionId,
            Request request,
            ICommandHandler<SubmitMetricsCommand, SubmitMetricsResponse> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new SubmitMetricsCommand(
                sessionId,
                request.MeanDwell,
                request.MedianFlight,
                request.CvFlight,
                request.MeanDelFreq,
                request.MeanTotTime,
                request.NKeys,
                request.DeleteCount,
                request.CapturedAt?.UtcDateTime);

            Result<SubmitMetricsResponse> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Stress)
        .RequireAuthorization()
        .WithSummary(
            "Submit a batch of 6 aggregated keyboard features; runs the ML " +
            "model and returns the resulting stress reading.");
    }
}
