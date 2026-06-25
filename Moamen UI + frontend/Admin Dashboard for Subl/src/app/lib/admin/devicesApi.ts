import { api } from "../apiClient";
import type { Device } from "../../data/mockData";

interface DeviceAdminDto {
  id: string;
  deviceName: string;
  userId: string;
  userEmail: string | null;
  department: string;
  platform: string;
  osVersion: string | null;
  agentVersion: string | null;
  lastIpAddress: string | null;
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  stressSignal: string;
  claimedByUserId: string | null;
  claimedByEmail: string | null;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

function toDevice(dto: DeviceAdminDto): Device {
  // "Active" reflects a live agent (recent heartbeat), not the enabled flag.
  const status: Device["status"] = dto.revokedAt
    ? "Revoked"
    : dto.isOnline
      ? "Active"
      : "Offline";

  return {
    id: dto.id,
    hostname: dto.deviceName,
    userId: dto.userId,
    userName: dto.userEmail ?? "—",
    department: dto.department,
    os: dto.osVersion ?? dto.platform,
    agentVersion: dto.agentVersion ?? "—",
    ip: dto.lastIpAddress ?? "—",
    status,
    lastSeen: fmt(dto.lastSeenAt),
    enrolledAt: fmt(dto.createdAt),
    stressSignal: (dto.stressSignal as Device["stressSignal"]) ?? "low",
    claimedByUserId: dto.claimedByUserId,
    dataOwner: dto.claimedByEmail ?? (dto.userEmail ?? "—"),
    isClaimed: dto.claimedByUserId != null,
  };
}

export async function fetchDevices(): Promise<Device[]> {
  const res = await api.get<DeviceAdminDto[]>("admin/devices");
  return res.map(toDevice);
}

export function revokeDevice(id: string): Promise<void> {
  return api.del<void>(`admin/devices/${id}`);
}

/**
 * Set which user a device's keystroke data feeds. Pass null to release the
 * claim so data falls back to the registrant (the agent's own account).
 */
export function assignDeviceOwner(id: string, userId: string | null): Promise<void> {
  return api.post<void>(`admin/devices/${id}/assign`, { userId });
}
