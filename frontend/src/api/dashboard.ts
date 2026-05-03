import { api } from './client';
import type { DashboardStats } from '@/types';

export const dashboardApi = {
  getStats: (range: 'today' | 'week' | 'month' = 'today') =>
    api.get<DashboardStats>(`/dashboard/stats?range=${range}`),
};
