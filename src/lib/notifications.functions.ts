import { api, TOKEN_KEY } from "@/lib/api";

const DEV_TOKEN = "__dev__";
const DEV_KEY = "dev_notifications_v1";
const isDev = () => typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY) === DEV_TOKEN;

function seed() {
  const now = Date.now();
  return [
    {
      id: "n1",
      title: "Dosar deschis cu succes",
      body: "Dosarul DEMO-2026-0001 a fost creat. Medicul de familie a fost notificat pentru emiterea CMCD.",
      type: "case_opened",
      read_at: null,
      created_at: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "n2",
      title: "CMCD emis",
      body: "Medicul a emis Certificatul Medical Constatator al Decesului. Cazul a fost transmis la Starea Civilă.",
      type: "cmcd_issued",
      read_at: null,
      created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "n3",
      title: "Termen legal: 3 zile",
      body: "Aveți la dispoziție 3 zile de la deces pentru declararea la Starea Civilă (L. 119/1996 art. 35).",
      type: "deadline",
      read_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
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
  } catch {
    return [];
  }
}
function devWrite(list: any[]) {
  localStorage.setItem(DEV_KEY, JSON.stringify(list));
}

export async function listNotifications() {
  if (isDev()) return { notifications: devRead() };
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
