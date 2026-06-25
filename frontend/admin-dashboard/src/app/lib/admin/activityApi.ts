import { api } from "../apiClient";

/** Mirrors the backend audit-log item from `GET admin/activity-feed`. */
export interface ActivityItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  actionName: string;
  entityType: string;
  entityName: string | null;
  description: string | null;
  timestamp: string;
}

export function fetchActivityFeed(limit = 15): Promise<ActivityItem[]> {
  return api.get<ActivityItem[]>("admin/activity-feed", { params: { limit } });
}
