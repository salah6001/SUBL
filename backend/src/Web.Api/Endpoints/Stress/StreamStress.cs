using System.IdentityModel.Tokens.Jwt;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using Application.Abstractions.RealTime;
using Infrastructure.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Stress;

/// <summary>
/// WebSocket endpoint for real-time stress readings.
/// The JWT is passed via ?token= because browsers cannot send Authorization headers
/// on WebSocket upgrade requests.
/// </summary>
internal sealed class StreamStress : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.Map("stress/stream", async (
            HttpContext context,
            IStressStreamHub hub,
            IOptions<JwtSettings> jwtSettings) =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                return;
            }

            string? token = context.Request.Query["token"];
            if (string.IsNullOrEmpty(token))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            ClaimsPrincipal? principal = ValidateToken(token, jwtSettings.Value);
            if (principal is null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            string? userIdClaim = principal.FindFirstValue(CustomClaimTypes.DomainUserId);
            if (!Guid.TryParse(userIdClaim, out Guid userId))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            using WebSocket ws = await context.WebSockets.AcceptWebSocketAsync();
            await hub.ServeClientAsync(userId, ws, context.RequestAborted);
        });
    }

    private static ClaimsPrincipal? ValidateToken(string token, JwtSettings settings)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var parameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Secret)),
                ValidateIssuer = true,
                ValidIssuer = settings.Issuer,
                ValidateAudience = true,
                ValidAudience = settings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            return handler.ValidateToken(token, parameters, out _);
        }
        catch
        {
            return null;
        }
    }
}
