import { api } from "../apiClient";

/** Mirrors the backend `AlertResponse` from `GET admin/alerts`. */
export interface AdminAlert {
  id: string;
  userId: string;
  department: string;
  category: string;   // HighStress | CriticalStress | SustainedStress | Anomaly
  severity: string;   // Low | Medium | High | Critical
  status: string;     // Open | Acknowledged | Resolved
  title: string;
  message: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface AlertFilters {
  status?: string;
  department?: string;
  severity?: string;
  limit?: number;
}

export function fetchAlerts(filters?: AlertFilters): Promise<AdminAlert[]> {
  return api.get<AdminAlert[]>("admin/alerts", { params: filters });
}

export function acknowledgeAlert(id: string): Promise<void> {
  return api.put<void>(`admin/alerts/${id}/acknowledge`);
}

export function resolveAlert(id: string): Promise<void> {
  return api.put<void>(`admin/alerts/${id}/resolve`);
}
