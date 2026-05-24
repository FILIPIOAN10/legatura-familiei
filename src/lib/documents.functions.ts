import { api } from "@/lib/api";

export async function registerUploadedDocument(data: {
  case_id: string;
  type: "id_card" | "birth_certificate" | "marriage_certificate" | "other";
  title: string;
  storage_path: string;
}) {
  return api.post<{ ok: boolean }>("/api/documents", data);
}

export async function getDocumentDownloadUrl(data: { document_id: string }) {
  return api.get<{ url: string; title: string }>(`/api/documents/${data.document_id}/download-url`);
}

export async function validateDocument(documentId: string) {
  return api.post<DocumentSummaryDto>(`/api/documents/${documentId}/validate`, {});
}

export async function requestDocumentClarification(documentId: string, note: string) {
  return api.post<DocumentSummaryDto>(`/api/documents/${documentId}/request-clarification`, {
    note,
  });
}

export type DocumentSummaryDto = {
  id: string;
  type: string;
  title: string;
  signed: boolean;
  validated: boolean;
  validated_at?: string | null;
  validation_note?: string | null;
  issued_at: string;
  storage_path?: string | null;
};

export async function uploadDocument(caseId: string, file: File, type: string, title: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("case_id", caseId);
  formData.append("type", type);
  formData.append("title", title);
  const res = await fetch(`${api.baseUrl}/api/documents/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Eroare la încărcare");
  }
  return res.json() as Promise<{ ok: boolean; document_id: string }>;
}
