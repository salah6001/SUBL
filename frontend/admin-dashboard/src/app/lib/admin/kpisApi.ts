import { api } from "../apiClient";

/** Mirrors the backend `AdminKpisResponse` from `GET admin/kpis`. */
export interface AdminKpis {
  wellnessScore: number;
  teamsAtRisk: number;
  totalEmployees: number;
  overallStressPercent: number;
  from: string;
  to: string;
}

export function fetchKpis(): Promise<AdminKpis> {
  return api.get<AdminKpis>("admin/kpis");
}

/** Maps an overall-stress percentage to a human label. */
export function stressLabel(percent: number): string {
  if (percent < 35) return "Low";
  if (percent < 70) return "Moderate";
  return "High";
}
