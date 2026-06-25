import { api } from "./client";

export interface MlSummary {
  total_sessions: number;
  avg_stress: number;
  peak_stress: number;
  dominant_emotion: string;
  dominant_label: string;
  hidden_stress_count: number;
}

export interface MlSession {
  id: string;
  ts: number;
  emotion: string;
  stress_score: number;
  stress_level: string;
  hidden_stress: number;
}

interface BackendSummary {
  totalSessions: number;
  avgStress: number;
  peakStress: number;
  dominantEmotion: string;
  dominantLabel: string;
  hiddenStressCount: number;
}

export const mlHistoryApi = {
  get: async (_limit = 50): Promise<{ sessions: MlSession[]; summary: MlSummary }> => {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const data = await api.get<BackendSummary>(`/stress/summary?from=${from}&to=${to}`);
    const summary: MlSummary = {
      total_sessions: data.totalSessions,
      avg_stress: data.avgStress,
      peak_stress: data.peakStress,
      dominant_emotion: data.dominantEmotion,
      dominant_label: data.dominantLabel,
      hidden_stress_count: data.hiddenStressCount,
    };
    return { sessions: [], summary };
  },
};
