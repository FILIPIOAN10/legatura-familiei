import { api, TOKEN_KEY } from "@/lib/api";

const DEV_KEY = "dev_documents_v1";
const isDev = () =>
  typeof window !== "undefined" && (localStorage.getItem(TOKEN_KEY) ?? "").startsWith("__dev__");

function devRead(): any[] {
  try {
    return JSON.parse(localStorage.getItem(DEV_KEY) || "[]");
  } catch {
    return [];
  }
}
function devWrite(list: any[]) {
  localStorage.setItem(DEV_KEY, JSON.stringify(list));
}

export function getDevDocumentsForCase(caseId: string) {
  return devRead().filter((d) => d.case_id === caseId);
}

export async function registerUploadedDocument(data: {
  case_id: string;
  type: "id_card" | "birth_certificate" | "marriage_certificate" | "other";
  title: string;
  storage_path: string;
}) {
  if (isDev()) {
    const list = devRead();
    list.unshift({
      id: (crypto as any).randomUUID?.() ?? `doc-${Date.now()}`,
      ...data,
      signed: false,
      issued_at: new Date().toISOString(),
    });
    devWrite(list);
    return { ok: true };
  }
  return api.post<{ ok: boolean }>("/documents", data);
}

export async function getDocumentDownloadUrl(data: { document_id: string }) {
  if (isDev()) {
    const d = devRead().find((x) => x.id === data.document_id);
    return {
      url: d?.storage_path ?? "about:blank",
      title: d?.title ?? "document",
    };
  }
  return api.get<{ url: string; title: string }>(`/documents/${data.document_id}/download-url`);
}

export async function uploadDocument(
  caseId: string,
  file: File,
  type: string,
  title: string,
) {
  if (isDev()) {
    // Store as data URL so it's downloadable from localStorage
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const list = devRead();
    list.unshift({
      id: (crypto as any).randomUUID?.() ?? `doc-${Date.now()}`,
      case_id: caseId,
      type,
      title,
      storage_path: dataUrl,
      signed: false,
      issued_at: new Date().toISOString(),
    });
    devWrite(list);
    return { ok: true };
  }
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
