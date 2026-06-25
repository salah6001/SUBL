import { api } from "../apiClient";

export interface DepartmentStressSlice {
  department: string;
  userCount: number;
  readingsCount: number;
  averageStressScore: number; // 0..1
  peakStressScore: number;
}

export interface DepartmentStressResponse {
  from: string;
  to: string;
  departments: DepartmentStressSlice[];
}

export interface StressDistributionSlice {
  level: string; // Low | Moderate | High | Critical
  count: number;
  percentage: number;
}

export interface StressDistributionResponse {
  from: string;
  to: string;
  totalReadings: number;
  slices: StressDistributionSlice[];
}

/** Returns ISO from/to for the last `days` days. */
export function recentRange(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function fetchDepartmentStress(days = 30): Promise<DepartmentStressResponse> {
  return api.get<DepartmentStressResponse>("stress/departments", { params: recentRange(days) });
}

export function fetchStressDistribution(days = 30): Promise<StressDistributionResponse> {
  return api.get<StressDistributionResponse>("stress/distribution", { params: recentRange(days) });
}
