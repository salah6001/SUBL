import { api } from "./apiClient";
import type { PagedResult } from "./types";
import type { AppNotification, NotificationType } from "../data/mockData";

interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  severity?: string;  // info | warning | error
  priority?: string;
}

function relTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function mapType(severity?: string): NotificationType {
  if (severity === "error") return "alert";
  if (severity === "warning") return "warning";
  return "info";
}

function toAppNotification(dto: NotificationDto): AppNotification {
  return {
    id: dto.id,
    title: dto.title,
    message: dto.message,
    time: relTime(dto.createdAt),
    read: dto.isRead,
    type: mapType(dto.severity),
  };
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await api.get<PagedResult<NotificationDto>>("notifications", {
    params: { page: 1, pageSize: 20 },
  });
  return res.items.map(toAppNotification);
}

export function markAllNotificationsRead(): Promise<void> {
  return api.post<void>("notifications/read-all");
}

export function archiveAllNotifications(): Promise<void> {
  return api.post<void>("notifications/archive-all");
}

export interface NotificationPrefs {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailDigestEnabled: boolean;
  quietHoursEnabled: boolean;
}

export function getNotificationPrefs(): Promise<NotificationPrefs> {
  return api.get<NotificationPrefs>("notifications/preferences");
}

/** Partial update — only the provided fields change. */
export function updateNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<void> {
  return api.put<void>("notifications/preferences", prefs);
}
