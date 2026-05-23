import { api, TOKEN_KEY } from "@/lib/api";

const DEV_KEY = "dev_notifications_v1";
export const isDev = () =>
  typeof window !== "undefined" && (localStorage.getItem(TOKEN_KEY) ?? "").startsWith("__dev__");

function seed() {
  const now = Date.now();
  return [
    {
      id: "n-seed-1",
      audience: "family",
      title: "Bun venit în ExitusRO",
      body: "Aici veți primi toate notificările despre dosarele dvs.: când medicul emite CMCD, când Starea Civilă validează, termenele legale etc.",
      type: "welcome",
      read_at: null,
      created_at: new Date(now - 1000 * 60 * 5).toISOString(),
    },
  ];
}

function devRead(): any[] {
  try {
    const raw = localStorage.getItem(DEV_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(DEV_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch { return []; }
}
function devWrite(list: any[]) { localStorage.setItem(DEV_KEY, JSON.stringify(list)); }

/** Push a notification targeted at one or more roles (or "all"). */
export function devPushNotification(opts: {
  audience: "family" | "doctor" | "civil_officer" | "funeral_provider" | "all";
  title: string;
  body: string;
  type: string;
  case_id?: string;
}) {
  const list = devRead();
  list.unshift({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read_at: null,
    created_at: new Date().toISOString(),
    ...opts,
  });
  devWrite(list);
}

function currentDevRole(): string | null {
  const t = localStorage.getItem(TOKEN_KEY) ?? "";
  if (t === "__dev__") return "family";
  if (t.startsWith("__dev__:")) return t.slice("__dev__:".length);
  return null;
}

export async function listNotifications() {
  if (isDev()) {
    const role = currentDevRole();
    const all = devRead();
    const filtered = all.filter((n) => !n.audience || n.audience === "all" || n.audience === role);
    return { notifications: filtered };
  }
  return api.get<{ notifications: any[] }>("/notifications");
}

export async function markNotificationRead(data: { id: string }) {
  if (isDev()) {
    const list = devRead().map((n) =>
      n.id === data.id ? { ...n, read_at: new Date().toISOString() } : n,
    );
    devWrite(list);
    return { ok: true };
  }
  return api.patch<{ ok: boolean }>(`/notifications/${data.id}/read`, {});
}
