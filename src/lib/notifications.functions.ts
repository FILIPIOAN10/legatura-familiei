import { api } from "@/lib/api";

export async function listNotifications() {
  return api.get<{ notifications: unknown[] }>("/api/notifications");
}

export async function markNotificationRead(data: { id: string }) {
  return api.patch<{ ok: boolean }>(`/api/notifications/${data.id}/read`, {});
}
