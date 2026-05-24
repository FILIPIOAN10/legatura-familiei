const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

const TOKEN_KEY = "exitusro_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getStoredToken() !== null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  full_name?: string;
  password: string;
  role?: string;
}

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  status: number;
  detail: string;
}

export type LoginResult =
  | { type: "ok"; user: ApiUser }
  | { type: "requires_2fa"; partial_token: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const hasBody = options?.body != null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (typeof body?.message === "string") detail = body.message;
    } catch {
      // body is not json, keep status text
    }
    if (res.status === 401) clearStoredToken();
    const err: ApiError = { status: res.status, detail };
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: API_BASE_URL,

  login: async (payload: LoginPayload): Promise<LoginResult> => {
    const data = await request<{ access_token?: string; partial_token?: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.partial_token && !data.access_token) {
      return { type: "requires_2fa", partial_token: data.partial_token };
    }
    setStoredToken(data.access_token!);
    const user = await request<ApiUser>("/auth/me");
    return { type: "ok", user };
  },

  verifyTotp: async (partial_token: string, code: string): Promise<ApiUser> => {
    const data = await request<{ access_token: string; token_type: string }>("/auth/verify-totp", {
      method: "POST",
      body: JSON.stringify({ partial_token, code }),
    });
    setStoredToken(data.access_token);
    return request<ApiUser>("/auth/me");
  },

  register: (payload: RegisterPayload) =>
    request<ApiUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: (): void => {
    clearStoredToken();
  },

  me: () => request<ApiUser>("/auth/me"),

  setup2fa: () =>
    request<{ secret: string; uri: string }>("/auth/2fa/setup", { method: "POST" }),

  enable2fa: (code: string) =>
    request<void>("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code }) }),

  disable2fa: (code: string) =>
    request<void>("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ code }) }),

  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
