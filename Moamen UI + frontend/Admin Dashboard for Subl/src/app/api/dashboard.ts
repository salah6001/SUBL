import { api } from "./client";

export interface DashboardSummary {
  wellnessScore: number;
  wellnessScoreChange: number;
  teamsAtRisk: string[];
  totalEmployees: number;
  activeEmployees: number;
  overallStressLevel: string;
  overallStressChange: number;
}

export interface DepartmentStress {
  department: string;
  averageScore: number;
  employeeCount: number;
}

export interface StressDistribution {
  normal: number;
  calm: number;
  highStress: number;
  burnoutRisk: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: string;
}

export const dashboardApi = {
  getSummary:      ()                                => api.get<DashboardSummary>("/admin/dashboard/summary"),
  getDepartments:  ()                                => api.get<DepartmentStress[]>("/stress/departments"),
  getDistribution: (from?: string, to?: string)      => api.get<StressDistribution>(`/stress/distribution${from ? `?from=${from}&to=${to}` : ""}`),
  getActivityFeed: (since?: string)                  => api.get<ActivityEvent[]>(`/admin/activity-feed${since ? `?since=${since}` : ""}`),
};
