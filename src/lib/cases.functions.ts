import { api } from "@/lib/api";

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

export interface ApiCaseSummary {
  id: string;
  case_number: string;
  status: string;
  deceased_full_name: string;
  deceased_dod: string;
  city?: string;
  county?: string;
  created_at: string;
}

export interface ApiAuditEntry {
  id: number;
  action: string;
  actor_name?: string;
  created_at: string;
}

export interface ApiCmcd {
  cause_main?: string;
  cause_secondary?: string;
  icd10?: string;
  issued_at?: string;
}

export interface ApiFuneral {
  date?: string;
  location?: string;
  completed_at?: string;
}

export interface ApiSelectedProvider {
  id: string;
  name: string;
  phone?: string;
  selected_at?: string;
}

export interface ApiCase extends ApiCaseSummary {
  deceased_cnp?: string;
  deceased_dob?: string;
  death_location?: string;
  death_cause_type?: "natural" | "violent" | "suspect" | "unknown";
  address?: string;
  cmcd?: ApiCmcd;
  certificate_number?: string;
  cert_issued_at?: string;
  funeral?: ApiFuneral;
  documents_submitted_at?: string;
  selected_provider?: ApiSelectedProvider;
}

export interface ApiCaseTask {
  id: string;
  title: string;
  legal_reference: string;
  legal_deadline?: string | null;
  status: "todo" | "done" | "in_progress";
}

export interface ApiDocument {
  id: string;
  type: string;
  title: string;
  storage_path?: string;
  signed: boolean;
  issued_at: string;
}

export async function listMyCases() {
  return api.get<{ cases: ApiCaseSummary[] }>("/api/cases");
}

export async function createCase(data: CreateCasePayload) {
  return api.post<{ case: ApiCaseSummary }>("/api/cases", data);
}

export async function getCase(id: string): Promise<{
  case: ApiCase;
  documents: ApiDocument[];
  tasks: ApiCaseTask[];
  audit: ApiAuditEntry[];
}> {
  return api.get(`/api/cases/${id}`);
}

export async function issueCmcd(data: {
  case_id: string;
  cause_main: string;
  cause_secondary?: string;
  icd10?: string;
}) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/cmcd`, data);
}

export async function validateAndIssueDeathCert(data: { case_id: string }) {
  return api.post<{ ok: boolean; certificate_number: string }>(
    `/api/cases/${data.case_id}/death-certificate`,
    {},
  );
}

export async function requestCorrections(data: { case_id: string; reason: string }) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/corrections`, data);
}

export async function scheduleFuneral(data: { case_id: string; date: string; location: string }) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/funeral`, data);
}

export async function completeFuneral(data: { case_id: string }) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/funeral/complete`, {});
}

export async function archiveCase(data: { case_id: string }) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/archive`, {});
}

export async function submitFamilyDocuments(data: {
  case_id: string;
  marriage_certificate_applicable: boolean;
  notes?: string;
}) {
  return api.post<{ ok: boolean; status: string }>(`/api/cases/${data.case_id}/submit-documents`, {
    marriageCertificateApplicable: data.marriage_certificate_applicable,
    notes: data.notes ?? null,
  });
}

export async function selectFuneralProvider(data: {
  case_id: string;
  provider_id: string;
  provider_name: string;
  provider_phone?: string;
}) {
  return api.post<{ ok: boolean; provider_id: string; provider_name: string }>(
    `/api/cases/${data.case_id}/select-funeral-provider`,
    {
      provider_id: data.provider_id,
      provider_name: data.provider_name,
      provider_phone: data.provider_phone ?? null,
    },
  );
}
