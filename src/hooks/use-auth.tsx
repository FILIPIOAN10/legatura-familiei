import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { api, TOKEN_KEY, type ApiUser } from "@/lib/api";

export type AppRole = "family" | "doctor" | "civil_officer" | "funeral_provider" | "notary" | "admin";

const DEV_TOKEN = "__dev__";
const DEV_USER: ApiUser = {
  id: "dev-user-id",
  email: "dev@example.com",
  username: "dev",
  full_name: "Dev User",
  role: "family",
};

interface AuthSession {
  access_token: string;
}

interface AuthCtx {
  session: AuthSession | null;
  user: ApiUser | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  refreshRoles: () => Promise<void>;
  devLogin: (() => void) | null;
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
    if (localStorage.getItem(TOKEN_KEY) === DEV_TOKEN) {
      setUser(DEV_USER);
      return;
    }
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      clearAuth();
    }
  };

  const signIn = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setSession({ access_token: token });
    await fetchUser();
    router.invalidate();
    qc.invalidateQueries();
  };

  const signOut = () => {
    clearAuth();
    router.invalidate();
    qc.invalidateQueries();
  };

  const refreshRoles = async () => {
    if (session) await fetchUser();
  };

  const devLogin = import.meta.env.DEV
    ? () => {
        localStorage.setItem(TOKEN_KEY, DEV_TOKEN);
        setSession({ access_token: DEV_TOKEN });
        setUser(DEV_USER);
        router.invalidate();
        qc.invalidateQueries();
      }
    : null;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      setSession({ access_token: token });
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roles: AppRole[] = user?.role ? [user.role as AppRole] : [];

  return (
    <Ctx.Provider value={{ session, user, roles, loading, signIn, signOut, refreshRoles, devLogin }}>
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
  const order: AppRole[] = ["admin", "doctor", "civil_officer", "notary", "funeral_provider", "family"];
  return order.find((r) => roles.includes(r)) ?? "family";
}
