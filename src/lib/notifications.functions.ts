import { api } from "@/lib/api";

export async function listNotifications() {
  return api.get<{ notifications: any[] }>("/notifications");
}

export async function markNotificationRead(data: { id: string }) {
  return api.patch<{ ok: boolean }>(`/notifications/${data.id}/read`, {});
}
