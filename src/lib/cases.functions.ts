import { api } from "@/lib/api";

export type CaseType = "violenta" | "suspecta" | "necunoscuta";

export interface CreateCasePayload {
  fullname: string;
  cnp: string;
  birthday: string;
  datetime_of_death: string;
  case_type: CaseType;
  place_of_death: string;
  judet: string;
  localitate: string;
  adresa_completa: string;
}

export type UpdateCasePayload = Partial<CreateCasePayload>;

export interface ApiCase {
  id: number;
  user_id: number;
  fullname: string;
  cnp: string;
  birthday: string;
  datetime_of_death: string;
  case_type: CaseType;
  place_of_death: string;
  judet: string;
  localitate: string;
  adresa_completa: string;
  created_at: string;
  updated_at: string;
}

export async function listCases(skip = 0, limit = 100) {
  return api.get<ApiCase[]>(`/cases/?skip=${skip}&limit=${limit}`);
}

export async function createCase(data: CreateCasePayload) {
  return api.post<ApiCase>("/cases/", data);
}

export async function getCase(id: number) {
  return api.get<ApiCase>(`/cases/${id}`);
}

export async function updateCase(id: number, data: UpdateCasePayload) {
  return api.patch<ApiCase>(`/cases/${id}`, data);
}

export async function deleteCase(id: number) {
  return api.delete<void>(`/cases/${id}`);
}
