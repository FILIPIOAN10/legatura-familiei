import { api, TOKEN_KEY } from "@/lib/api";
import { getDevDocumentsForCase } from "@/lib/documents.functions";

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
    status: "AWAITING_DOCTOR",
    created_at: now,
    ...data,
  };
  list.unshift(newCase);
  devWrite(list);
  return { case: newCase };
}

function devGet(id: string) {
  const c = devRead().find((x) => x.id === id);
  if (!c) return { case: null, documents: [], tasks: [], audit: [] };
  const created = new Date(c.created_at).getTime();
  const dod = new Date(c.deceased_dod).getTime();
  const tasks = [
    {
      id: `${id}-t1`,
      title: "Declarare deces la Starea Civilă",
      legal_reference: "L. 119/1996 art. 35",
      legal_deadline: new Date(dod + 1000 * 60 * 60 * 24 * 3).toISOString(),
      status: c.status === "DEATH_CERT_ISSUED" ? "done" : "todo",
    },
    {
      id: `${id}-t2`,
      title: "Eliberare CMCD de către medic",
      legal_reference: "Ord. MS 1147/2012",
      legal_deadline: new Date(dod + 1000 * 60 * 60 * 48).toISOString(),
      status: ["CMCD_ISSUED", "AWAITING_CIVIL_OFFICER", "DEATH_CERT_ISSUED"].includes(c.status) ? "done" : "todo",
    },
    {
      id: `${id}-t3`,
      title: "Validare și emitere certificat de deces",
      legal_reference: "L. 119/1996",
      legal_deadline: null,
      status: c.status === "DEATH_CERT_ISSUED" ? "done" : "todo",
    },
  ];
  const audit = [
    { id: `${id}-a1`, action: "Dosar deschis", created_at: c.created_at },
    { id: `${id}-a2`, action: "Medic notificat", created_at: new Date(created + 1000 * 60).toISOString() },
  ];
  return { case: c, documents: getDevDocumentsForCase(id), tasks, audit };
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
