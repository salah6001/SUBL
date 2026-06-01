import { api } from "./client";

export interface CurrentStress {
  hasData: boolean;
  score: number | null;
  level: string | null;
  at: string | null;
  sessionId: string | null;
}

export interface StressReading {
  id: string;
  sessionId: string;
  score: number;
  level: string;
  confidence: number;
  modelVersion: string;
  createdAt: string;
}

export interface StressTrend {
  bucketStart: string;
  averageScore: number;
  peakScore: number;
  readingsCount: number;
}

export const stressApi = {
  getCurrent: () => api.get<CurrentStress>("/stress/current"),
  getReadings: (page = 1, pageSize = 50) =>
    api.get<{ items: StressReading[]; totalCount: number }>(`/stress/readings?page=${page}&pageSize=${pageSize}`),
  getTrends: (from: string, to: string, granularity = "Hour") =>
    api.get<StressTrend[]>(`/stress/trends?from=${from}&to=${to}&granularity=${granularity}`),
};
