using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Devices.GetMyDevices;

/// <summary>
/// Query to get all devices registered by the current user.
/// </summary>
public sealed record GetMyDevicesQuery(bool IncludeRevoked = false) : IQuery<List<DeviceResponse>>;
