using Application.Abstractions.Messaging;
using Application.StressDetection.Common;

namespace Application.StressDetection.Devices.GetClaimableDevices;

/// <summary>
/// Query to list active devices the current user may claim, flagging which one
/// (if any) currently feeds their dashboard.
/// </summary>
public sealed record GetClaimableDevicesQuery : IQuery<List<ClaimableDeviceResponse>>;
