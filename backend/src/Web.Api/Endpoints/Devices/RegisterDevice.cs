using Application.Abstractions.Messaging;
using Application.StressDetection.Devices.RegisterDevice;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Devices;

internal sealed class RegisterDevice : IEndpoint
{
    public sealed record Request(
        string DeviceName,
        string DeviceFingerprint,
        string Platform,
        string? OsVersion,
        string? AgentVersion);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("devices", async (
            Request request,
            HttpContext httpContext,
            ICommandHandler<RegisterDeviceCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            string? ip = httpContext.Connection.RemoteIpAddress?.ToString();

            var command = new RegisterDeviceCommand(
                request.DeviceName,
                request.DeviceFingerprint,
                request.Platform,
                request.OsVersion,
                request.AgentVersion,
                ip);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(
                id => Results.Created($"/devices/{id}", new { id }),
                CustomResults.Problem);
        })
        .WithTags(Tags.Devices)
        .RequireAuthorization()
        .WithSummary("Register (or re-register) a desktop agent device for the current user");
    }
}
