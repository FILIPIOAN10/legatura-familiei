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
  return api.get<{ cases: any[] }>("/cases");
}

export async function createCase(data: CreateCasePayload) {
  return api.post<{ case: any }>("/cases", data);
}

export async function getCase(id: string) {
  return api.get<{ case: any; documents: any[]; tasks: any[]; audit: any[] }>(`/cases/${id}`);
}

export async function issueCmcd(data: {
  case_id: string;
  cause_main: string;
  cause_secondary?: string;
  icd10?: string;
}) {
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/cmcd`, data);
}

export async function validateAndIssueDeathCert(data: { case_id: string }) {
  return api.post<{ ok: boolean; certificate_number: string }>(
    `/cases/${data.case_id}/death-certificate`,
    {},
  );
}

export async function requestCorrections(data: { case_id: string; reason: string }) {
  return api.post<{ ok: boolean }>(`/cases/${data.case_id}/corrections`, data);
}
