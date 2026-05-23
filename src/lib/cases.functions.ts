import { api, TOKEN_KEY } from "@/lib/api";

export interface CreateCasePayload {
  deceased_full_name: string;
  deceased_cnp?: string;
  deceased_dob?: string;
  deceased_dod: string;
  death_location?: string;
  death_cause_type: "natural" | "violent" | "suspect" | "unknown";
  city?: string;
  county?: string;
  address?: string;
}

// ---- Dev mock (works without the FastAPI backend) ----
const DEV_TOKEN = "__dev__";
const DEV_KEY = "dev_cases_v1";
const isDev = () => typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY) === DEV_TOKEN;

function devRead(): any[] {
  try { return JSON.parse(localStorage.getItem(DEV_KEY) || "[]"); } catch { return []; }
}
function devWrite(list: any[]) { localStorage.setItem(DEV_KEY, JSON.stringify(list)); }

function devCreate(data: CreateCasePayload) {
  const list = devRead();
  const now = new Date().toISOString();
  const id = (crypto as any).randomUUID?.() ?? `dev-${Date.now()}`;
  const n = list.length + 1;
  const newCase = {
    id,
    case_number: `DEMO-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`,
    status: "opened",
    created_at: now,
    ...data,
  };
  list.unshift(newCase);
  devWrite(list);
  return { case: newCase };
}

function devGet(id: string) {
  const c = devRead().find((x) => x.id === id);
  return { case: c ?? null, documents: [], tasks: [], audit: [] };
}

export async function listMyCases() {
  if (isDev()) return { cases: devRead() };
  return api.get<{ cases: any[] }>("/cases");
}

export async function createCase(data: CreateCasePayload) {
  if (isDev()) return devCreate(data);
  return api.post<{ case: any }>("/cases", data);
}

export async function getCase(id: string): Promise<{ case: any; documents: any[]; tasks: any[]; audit: any[] }> {
  if (isDev()) return devGet(id);
  return api.get(`/cases/${id}`);
}

export async function issueCmcd(data: {
  case_id: string;
  cause_main: string;
  cause_secondary?: string;
  icd10?: string;
}) {
  if (isDev()) return { ok: true };
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/cmcd`, data);
}

export async function validateAndIssueDeathCert(data: { case_id: string }) {
  if (isDev()) return { ok: true, certificate_number: `DEMO-CERT-${Date.now()}` };
  return api.post<{ ok: boolean; certificate_number: string }>(
    `/cases/${data.case_id}/death-certificate`,
    {},
  );
}

export async function requestCorrections(data: { case_id: string; reason: string }) {
  if (isDev()) return { ok: true };
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/corrections`, data);
}
