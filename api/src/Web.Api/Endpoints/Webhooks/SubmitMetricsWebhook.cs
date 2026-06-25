using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Application.Abstractions.Messaging;
using Application.StressDetection.Common;
using Application.StressDetection.Stress.SubmitMetrics;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using SharedKernel;
using Web.Api;
using Web.Api.Endpoints;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Webhooks;

/// <summary>
/// Receives signed webhook metrics from the desktop agent.
/// </summary>
internal sealed class SubmitMetricsWebhook : IEndpoint
{
    public sealed record Request(
        double MeanDwell,
        double MedianFlight,
        double CvFlight,
        double MeanDelFreq,
        double MeanTotTime,
        int NKeys,
        int? DeleteCount,
        DateTimeOffset? CapturedAt);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("webhooks/stress-sessions/{sessionId:guid}/metrics", async (
            Guid sessionId,
            HttpRequest httpRequest,
            IOptions<AgentWebhookSettings> options,
            ICommandHandler<SubmitMetricsCommand, SubmitMetricsResponse> handler,
            CancellationToken cancellationToken) =>
        {
            AgentWebhookSettings settings = options.Value;

            string body;
            using (var reader = new StreamReader(httpRequest.Body, Encoding.UTF8))
            {
                body = await reader.ReadToEndAsync(cancellationToken);
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                return Results.BadRequest(new { detail = "Request body is required." });
            }

            if (!TryValidateSignature(httpRequest, settings, body, out IResult failureResult))
            {
                return failureResult;
            }

            Request? request;
            try
            {
                request = JsonSerializer.Deserialize<Request>(body, JsonOptions);
            }
            catch (JsonException)
            {
                return Results.BadRequest(new { detail = "Invalid JSON payload." });
            }

            if (request is null)
            {
                return Results.BadRequest(new { detail = "Invalid JSON payload." });
            }

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
        .AllowAnonymous()
        .RequireRateLimiting(RateLimitPolicies.Webhooks)
        .WithSummary("Receive signed webhook metrics from the desktop agent.");
    }

    private static bool TryValidateSignature(
        HttpRequest request,
        AgentWebhookSettings settings,
        string body,
        out IResult failureResult)
    {
        if (string.IsNullOrWhiteSpace(settings.Secret))
        {
            failureResult = Results.Problem(
                title: "Webhook secret is not configured.",
                statusCode: StatusCodes.Status500InternalServerError);
            return false;
        }

        if (!request.Headers.TryGetValue(settings.TimestampHeader, out StringValues timestampValues) ||
            !long.TryParse(timestampValues.FirstOrDefault(), out long timestamp))
        {
            failureResult = Results.Unauthorized();
            return false;
        }

        long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        long skew = Math.Abs(now - timestamp);
        if (skew > settings.MaxSkewSeconds)
        {
            failureResult = Results.Unauthorized();
            return false;
        }

        if (!request.Headers.TryGetValue(settings.SignatureHeader, out StringValues signatureValues))
        {
            failureResult = Results.Unauthorized();
            return false;
        }

        string providedSignature = signatureValues.FirstOrDefault() ?? string.Empty;
        providedSignature = NormalizeSignature(providedSignature);

        string expectedSignature = ComputeSignature(settings.Secret, timestamp, body);

        if (!FixedTimeEquals(providedSignature, expectedSignature))
        {
            failureResult = Results.Unauthorized();
            return false;
        }

        failureResult = Results.Ok();
        return true;
    }

    private static string NormalizeSignature(string signature)
    {
        string value = signature.Trim();
        if (value.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
        {
            value = value[7..];
        }
        return value.ToUpperInvariant();
    }

    private static string ComputeSignature(string secret, long timestamp, string body)
    {
        string payload = $"{timestamp}.{body}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash);
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        if (left.Length != right.Length)
        {
            return false;
        }

        byte[] leftBytes = Encoding.UTF8.GetBytes(left);
        byte[] rightBytes = Encoding.UTF8.GetBytes(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}
