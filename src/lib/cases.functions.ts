import { api, TOKEN_KEY } from "@/lib/api";
import { getDevDocumentsForCase } from "@/lib/documents.functions";
import { devPushNotification } from "@/lib/notifications.functions";
import { REQUIRED_FAMILY_DOC_TYPES } from "@/lib/legal";

export class FlowGuardError extends Error {
  detail: string;
  constructor(detail: string) {
    super(detail);
    this.detail = detail;
  }
}

export interface CreateCasePayload {
  deceased_full_name: string;
  deceased_dob?: string;
  deceased_dod: string;
  death_location?: string;
  death_cause_type: "natural" | "violent" | "suspect" | "unknown";
  city?: string;
  county?: string;
  address?: string;
}

const DEV_KEY = "dev_cases_v1";
const isDev = () =>
  typeof window !== "undefined" && (localStorage.getItem(TOKEN_KEY) ?? "").startsWith("__dev__");

function devRead(): any[] {
  try { return JSON.parse(localStorage.getItem(DEV_KEY) || "[]"); } catch { return []; }
}
function devWrite(list: any[]) { localStorage.setItem(DEV_KEY, JSON.stringify(list)); }

function pushAudit(caseId: string, action: string) {
  const list = devRead();
  const idx = list.findIndex((x) => x.id === caseId);
  if (idx === -1) return;
  list[idx].audit = list[idx].audit ?? [];
  list[idx].audit.unshift({ id: `a-${Date.now()}`, action, created_at: new Date().toISOString() });
  devWrite(list);
}

function setStatus(caseId: string, status: string, extra?: Record<string, any>) {
  const list = devRead();
  const idx = list.findIndex((x) => x.id === caseId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status, ...(extra ?? {}) };
  devWrite(list);
}

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
    audit: [{ id: `a-${Date.now()}`, action: "Dosar deschis de aparținător", created_at: now }],
    ...data,
  };
  list.unshift(newCase);
  devWrite(list);
  devPushNotification({
    audience: "doctor",
    title: "Caz nou de constatat",
    body: `Aparținătorul a deschis dosarul ${newCase.case_number} pentru ${data.deceased_full_name}. Eliberați CMCD.`,
    type: "case_assigned",
    case_id: id,
  });
  devPushNotification({
    audience: "family",
    title: "Dosar deschis",
    body: `Dosarul ${newCase.case_number} a fost creat. Medicul a fost notificat.`,
    type: "case_opened",
    case_id: id,
  });
  return { case: newCase };
}

function devGet(id: string) {
  const c = devRead().find((x) => x.id === id);
  if (!c) return { case: null, documents: [], tasks: [], audit: [] };
  const dod = new Date(c.deceased_dod).getTime();
  const done = (statuses: string[]) => statuses.includes(c.status) ? "done" : "todo";
  const tasks = [
    { id: `${id}-t1`, title: "Eliberare CMCD de către medic", legal_reference: "Ord. MS 1147/2012",
      legal_deadline: new Date(dod + 1000 * 60 * 60 * 48).toISOString(),
      status: done(["CMCD_ISSUED", "AWAITING_CIVIL_OFFICER", "DEATH_CERT_ISSUED", "FUNERAL_SCHEDULED", "FUNERAL_COMPLETED"]) },
    { id: `${id}-t2`, title: "Încărcare acte aparținător", legal_reference: "L. 119/1996 art. 35",
      legal_deadline: new Date(dod + 1000 * 60 * 60 * 60).toISOString(),
      status: done(["AWAITING_CIVIL_OFFICER", "DEATH_CERT_ISSUED", "FUNERAL_SCHEDULED", "FUNERAL_COMPLETED"]) },
    { id: `${id}-t3`, title: "Emitere certificat de deces (SIIEASC)", legal_reference: "L. 119/1996 art. 35",
      legal_deadline: new Date(dod + 1000 * 60 * 60 * 72).toISOString(),
      status: done(["DEATH_CERT_ISSUED", "FUNERAL_SCHEDULED", "FUNERAL_COMPLETED"]) },
    { id: `${id}-t4`, title: "Programare servicii funerare", legal_reference: "L. 102/2014",
      legal_deadline: null,
      status: done(["FUNERAL_SCHEDULED", "FUNERAL_COMPLETED"]) },
  ];
  return { case: c, documents: getDevDocumentsForCase(id), tasks, audit: c.audit ?? [] };
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

export async function issueCmcd(data: { case_id: string; cause_main: string; cause_secondary?: string; icd10?: string }) {
  if (isDev()) {
    setStatus(data.case_id, "CMCD_ISSUED", { cmcd: data, cmcd_issued_at: new Date().toISOString() });
    pushAudit(data.case_id, `CMCD emis de medic — cauză: ${data.cause_main}`);
    const c = devRead().find((x) => x.id === data.case_id);
    devPushNotification({
      audience: "family",
      title: "CMCD a fost emis",
      body: `Medicul a emis Certificatul Medical pentru dosarul ${c?.case_number}. Încărcați acum actele necesare (CI/BI decedat, certificat naștere, CI declarant și, dacă e cazul, certificat căsătorie).`,
      type: "cmcd_issued",
      case_id: data.case_id,
    });
    return { ok: true };
  }
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/cmcd`, data);
}

export async function submitDocumentsToCivilOfficer(data: { case_id: string }) {
  if (isDev()) {
    const c = devRead().find((x) => x.id === data.case_id);
    if (!c) throw new FlowGuardError("Dosar inexistent.");
    if (c.status !== "CMCD_ISSUED") {
      throw new FlowGuardError("Actele pot fi trimise doar după emiterea CMCD.");
    }
    const docs = getDevDocumentsForCase(data.case_id);
    const uploaded = new Set(docs.map((d) => d.type));
    const missing = REQUIRED_FAMILY_DOC_TYPES.filter((t) => !uploaded.has(t));
    if (missing.length > 0) {
      throw new FlowGuardError("Trebuie încărcate toate actele obligatorii înainte de a trimite dosarul la Starea Civilă.");
    }
    setStatus(data.case_id, "AWAITING_CIVIL_OFFICER", { docs_submitted_at: new Date().toISOString() });
    pushAudit(data.case_id, "Acte aparținător trimise spre validare la Starea Civilă");
    devPushNotification({
      audience: "civil_officer",
      title: "Dosar gata de validare",
      body: `Dosarul ${c.case_number} (${c.deceased_full_name}) are CMCD-ul și actele aparținătorului încărcate. Verificați și emiteți certificatul de deces.`,
      type: "civil_pending",
      case_id: data.case_id,
    });
    devPushNotification({
      audience: "family",
      title: "Acte trimise la Starea Civilă",
      body: `Dosarul ${c.case_number} a fost transmis funcționarului de stare civilă. Vă vom notifica imediat ce certificatul de deces este gata.`,
      type: "docs_submitted",
      case_id: data.case_id,
    });
    return { ok: true };
  }
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/submit-documents`, {});
}

export async function validateAndIssueDeathCert(data: { case_id: string }) {
  const cert = `RO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
  if (isDev()) {
    const c = devRead().find((x) => x.id === data.case_id);
    if (!c) throw new FlowGuardError("Dosar inexistent.");
    if (c.status !== "AWAITING_CIVIL_OFFICER") {
      throw new FlowGuardError("Certificatul poate fi emis doar după ce aparținătorul a trimis actele la Starea Civilă.");
    }
    const docs = getDevDocumentsForCase(data.case_id);
    const uploaded = new Set(docs.map((d) => d.type));
    const missing = REQUIRED_FAMILY_DOC_TYPES.filter((t) => !uploaded.has(t));
    if (missing.length > 0) {
      throw new FlowGuardError("Dosarul nu conține toate actele obligatorii. Solicitați aparținătorului să completeze.");
    }
    setStatus(data.case_id, "DEATH_CERT_ISSUED", { certificate_number: cert, cert_issued_at: new Date().toISOString() });
    pushAudit(data.case_id, `Certificat de deces ${cert} emis de Starea Civilă`);
    devPushNotification({ audience: "family", title: "Certificat de deces emis", body: `Certificatul ${cert} este disponibil în dosarul ${c.case_number}. Puteți contacta o casă funerară.`, type: "death_cert", case_id: data.case_id });
    devPushNotification({ audience: "funeral_provider", title: "Familie disponibilă pentru servicii funerare", body: `Familia ${c.deceased_full_name} (dosar ${c.case_number}) poate fi contactată — certificat emis.`, type: "funeral_lead", case_id: data.case_id });
    return { ok: true, certificate_number: cert };
  }
  return api.post<{ ok: boolean; certificate_number: string }>(`/cases/${data.case_id}/death-certificate`, {});
}

export async function requestCorrections(data: { case_id: string; reason: string }) {
  if (isDev()) {
    pushAudit(data.case_id, `Corecții solicitate de Starea Civilă: ${data.reason}`);
    setStatus(data.case_id, "AWAITING_DOCTOR");
    const c = devRead().find((x) => x.id === data.case_id);
    devPushNotification({ audience: "doctor", title: "Corecții solicitate", body: `Pentru dosarul ${c?.case_number}: ${data.reason}`, type: "corrections", case_id: data.case_id });
    return { ok: true };
  }
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/corrections`, data);
}

export async function scheduleFuneral(data: { case_id: string; date: string; location: string }) {
  if (isDev()) {
    setStatus(data.case_id, "FUNERAL_SCHEDULED", { funeral: data });
    pushAudit(data.case_id, `Înmormântare programată: ${data.date} — ${data.location}`);
    const c = devRead().find((x) => x.id === data.case_id);
    devPushNotification({ audience: "family", title: "Înmormântare programată", body: `Casa funerară a programat serviciul pentru ${new Date(data.date).toLocaleString("ro-RO")} la ${data.location}.`, type: "funeral_scheduled", case_id: data.case_id });
    return { ok: true };
  }
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/funeral`, data);
}

export async function completeFuneral(data: { case_id: string }) {
  if (isDev()) {
    setStatus(data.case_id, "FUNERAL_COMPLETED");
    pushAudit(data.case_id, "Înmormântare finalizată");
    return { ok: true };
  }
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/funeral/complete`, {});
}
