import { api } from "./client";

export interface AppNotification {
  id: string;
  type: string;
  typeName: string;
  title: string;
  message: string;
  priority: string;
  icon: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailDigestEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export const notificationsApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<{ items: AppNotification[]; totalCount: number }>(
      `/notifications?page=${page}&pageSize=${pageSize}`
    ),
  getUnreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    api.post<void>(`/notifications/${id}/read`, {}),
  markAllRead: () =>
    api.post<{ markedCount: number }>("/notifications/read-all", {}),
  dismiss: (id: string) =>
    api.delete<void>(`/notifications/${id}`),
  getPrefs: () =>
    api.get<NotificationPrefs>("/notifications/preferences"),
  updatePrefs: (prefs: Partial<NotificationPrefs>) =>
    api.put<void>("/notifications/preferences", prefs),
};
