using Application.Abstractions.Messaging;
using Application.Admin.Common;

namespace Application.Admin.GetAdminDevices;

public sealed record GetAdminDevicesQuery(bool IncludeRevoked = true) : IQuery<List<AdminDeviceResponse>>;
