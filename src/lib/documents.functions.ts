import { api, TOKEN_KEY } from "@/lib/api";

export async function registerUploadedDocument(data: {
  case_id: string;
  type: "id_card" | "birth_certificate" | "marriage_certificate" | "other";
  title: string;
  storage_path: string;
}) {
  return api.post<{ ok: boolean }>("/documents", data);
}

export async function getDocumentDownloadUrl(data: { document_id: string }) {
  return api.get<{ url: string; title: string }>(`/documents/${data.document_id}/download-url`);
}

export async function uploadDocument(
  caseId: string,
  file: File,
  type: string,
  title: string,
) {
  const token = localStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("case_id", caseId);
  formData.append("type", type);
  formData.append("title", title);
  const res = await fetch(`${api.baseUrl}/documents/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Eroare la încărcare");
  }
  return res.json();
}
