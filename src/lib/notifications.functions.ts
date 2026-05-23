import { api } from "@/lib/api";

export interface ApiNotification {
  id: string;
  audience?: string;
  title: string;
  body: string;
  type: string;
  case_id?: string;
  read_at?: string | null;
  created_at: string;
}

export async function listNotifications() {
  return api.get<{ notifications: ApiNotification[] }>("/api/notifications");
}

export async function markNotificationRead(data: { id: string }) {
  return api.patch<{ ok: boolean }>(`/api/notifications/${data.id}/read`, {});
}
