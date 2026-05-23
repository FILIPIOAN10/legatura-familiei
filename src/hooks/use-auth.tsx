import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { api, hasAuthCookie, type ApiUser } from "@/lib/api";

export type AppRole = ApiUser["role"];

interface AuthCtx {
  user: ApiUser | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  const fetchUser = async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const u = await api.login({ email, password });
    setUser(u);
    router.invalidate();
    qc.invalidateQueries();
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // ignore; still clear local state
    }
    setUser(null);
    router.invalidate();
    qc.invalidateQueries();
  };

  const refresh = async () => {
    await fetchUser();
  };

  useEffect(() => {
    if (hasAuthCookie()) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const roles: AppRole[] = user?.role ? [user.role] : [];

  return (
    <Ctx.Provider value={{ user, roles, loading, signIn, signOut, refresh }}>
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
  const order: AppRole[] = [
    "admin",
    "doctor",
    "civil_officer",
    "notary",
    "funeral_provider",
    "family",
  ];
  return order.find((r) => roles.includes(r)) ?? "family";
}
