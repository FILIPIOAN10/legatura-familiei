import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { api, TOKEN_KEY, type ApiUser } from "@/lib/api";

export type AppRole = "family" | "doctor" | "civil_officer" | "funeral_provider" | "admin";

const DEV_TOKEN_PREFIX = "__dev__";

export const DEV_USERS: Record<AppRole, ApiUser> = {
  family: { id: "dev-family", email: "demo.family@exitusro.ro", username: "demo_family", full_name: "Maria Ionescu (Aparținător)", role: "family" },
  doctor: { id: "dev-doctor", email: "demo.doctor@exitusro.ro", username: "demo_doctor", full_name: "Dr. Andrei Popescu", role: "doctor" },
  civil_officer: { id: "dev-civil", email: "demo.civil@exitusro.ro", username: "demo_civil", full_name: "Elena Vasilescu (Stare Civilă)", role: "civil_officer" },
  funeral_provider: { id: "dev-funeral", email: "demo.funeral@exitusro.ro", username: "demo_funeral", full_name: "Casa Funerară Liniștea", role: "funeral_provider" },
  admin: { id: "dev-admin", email: "demo.admin@exitusro.ro", username: "demo_admin", full_name: "Administrator", role: "admin" },
};

function parseDevToken(token: string | null): AppRole | null {
  if (!token) return null;
  if (token === DEV_TOKEN_PREFIX) return "family"; // back-compat
  if (token.startsWith(DEV_TOKEN_PREFIX + ":")) {
    const r = token.slice(DEV_TOKEN_PREFIX.length + 1) as AppRole;
    if (r in DEV_USERS) return r;
  }
  return null;
}

interface AuthSession { access_token: string }

interface AuthCtx {
  session: AuthSession | null;
  user: ApiUser | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  refreshRoles: () => Promise<void>;
  devLogin: (() => void) | null;
  devLoginAs: ((role: AppRole) => void) | null;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
    setUser(null);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const devRole = parseDevToken(token);
    if (devRole) { setUser(DEV_USERS[devRole]); return; }
    try { setUser(await api.me()); } catch { clearAuth(); }
  };

  const signIn = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setSession({ access_token: token });
    await fetchUser();
    router.invalidate();
    qc.invalidateQueries();
  };

  const signOut = () => { clearAuth(); router.invalidate(); qc.invalidateQueries(); };
  const refreshRoles = async () => { if (session) await fetchUser(); };

  const devLoginAs = import.meta.env.DEV
    ? (role: AppRole) => {
        const token = `${DEV_TOKEN_PREFIX}:${role}`;
        localStorage.setItem(TOKEN_KEY, token);
        setSession({ access_token: token });
        setUser(DEV_USERS[role]);
        router.invalidate();
        qc.invalidateQueries();
      }
    : null;

  const devLogin = devLoginAs ? () => devLoginAs("family") : null;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      setSession({ access_token: token });
      fetchUser().finally(() => setLoading(false));
    } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roles: AppRole[] = user?.role ? [user.role as AppRole] : [];

  return (
    <Ctx.Provider value={{ session, user, roles, loading, signIn, signOut, refreshRoles, devLogin, devLoginAs }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

export function primaryRole(roles: AppRole[]): AppRole {
  const order: AppRole[] = ["admin", "doctor", "civil_officer", "funeral_provider", "family"];
  return order.find((r) => roles.includes(r)) ?? "family";
}
