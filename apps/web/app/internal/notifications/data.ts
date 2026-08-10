import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export type NotificationType = "READINESS_ALERT" | "READINESS_REMINDER";

export interface Notification {
  actionUrl: string;
  createdAt: string;
  id: string;
  message: string;
  projectId: string;
  readAt: string | null;
  title: string;
  type: NotificationType;
}

export interface NotificationPreference {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  type: NotificationType;
  version: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Notification data is unavailable");
  return (await result.json()) as T;
}

export const notifications = () =>
  response<{
    data: Notification[];
    meta: { unread: number };
  }>("/api/v1/notifications?pageSize=100");

export const notificationPreferences = () =>
  response<{ data: NotificationPreference[] }>(
    "/api/v1/notification-preferences",
  ).then(({ data }) => data);
