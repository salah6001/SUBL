import { api } from "./client";

export interface ClaimableDevice {
  id: string;
  deviceName: string;
  platform: string;
  lastSeenAt: string | null;
  isActive: boolean;
  /** True when an agent is actually running (reported within the online window). */
  isOnline: boolean;
  claimedByMe: boolean;
  claimedByOther: boolean;
}

export interface AutoClaimResult {
  deviceId: string | null;
  deviceName: string | null;
  /** True when this call newly claimed a device. */
  claimed: boolean;
}

export const devicesApi = {
  /** Active devices the current user may claim, flagging which one feeds them. */
  getClaimable: () => api.get<ClaimableDevice[]>("/devices/claimable"),

  /** Point a device's keystroke data at the current user's dashboard. */
  claim: (deviceId: string) => api.post<void>(`/devices/${deviceId}/claim`),

  /** Auto-claim the freshest online unclaimed device (called once on login). */
  autoClaim: () => api.post<AutoClaimResult>("/devices/auto-claim"),

  /** Remove a device from the monitoring list (revokes registration). */
  remove: (deviceId: string) => api.delete<void>(`/devices/${deviceId}`),
};
