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

export async function listMyCases() {
  return api.get<{ cases: unknown[] }>("/api/cases");
}

export async function createCase(data: CreateCasePayload) {
  return api.post<{ case: unknown }>("/api/cases", data);
}

export async function getCase(
  id: string,
): Promise<{ case: unknown; documents: unknown[]; tasks: unknown[]; audit: unknown[] }> {
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

export async function scheduleFuneral(data: {
  case_id: string;
  date: string;
  location: string;
}) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/funeral`, data);
}

export async function completeFuneral(data: { case_id: string }) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/funeral/complete`, {});
}

export async function archiveCase(data: { case_id: string }) {
  return api.post<{ ok: boolean }>(`/api/cases/${data.case_id}/archive`, {});
}
