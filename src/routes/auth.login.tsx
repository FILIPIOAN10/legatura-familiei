import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { TOKEN_KEY } from "@/lib/api";
import { useState } from "react";
import { api, type ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, UserPlus } from "lucide-react";

interface AuthError {
  title: string;
  message: string;
  action?: { label: string; to?: string };
}

function parseError(err: unknown): AuthError {
  const e = err as ApiError;
  const detail = typeof e?.detail === "string" ? e.detail.toLowerCase() : "";

  if (e?.status === 401 || /incorrect|invalid|wrong|password|credentials/i.test(detail)) {
    return {
      title: "Date de autentificare incorecte",
      message: "Email-ul sau parola introdusă nu sunt corecte. Verificați tasta Caps Lock și încercați din nou.",
      action: { label: "Creează cont nou", to: "/auth/signup" },
    };
  }
  if (e?.status === 429 || /rate|too many/i.test(detail)) {
    return {
      title: "Prea multe încercări",
      message: "Ați încercat de prea multe ori. Așteptați câteva minute înainte de a încerca din nou.",
    };
  }
  if (!navigator.onLine || /network|fetch/i.test(detail)) {
    return {
      title: "Problemă de conexiune",
      message: "Nu s-a putut conecta la server. Verificați conexiunea la internet și încercați din nou.",
    };
  }
  return {
    title: "Eroare la autentificare",
    message: (e as any)?.detail || "A apărut o eroare necunoscută. Încercați din nou mai târziu.",
  };
}

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    if (localStorage.getItem(TOKEN_KEY)) throw redirect({ to: "/cases" });
  },
  head: () => ({
    meta: [
      { title: "Autentificare — ExitusRO" },
      { name: "description", content: "Accesați dosarul dvs. în platforma ExitusRO." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const auth = useAuth();
  const nav = useNavigate();

  const devSkip = (role: "family" | "doctor" | "civil_officer" | "funeral_provider") => {
    auth.devLoginAs?.(role);
    nav({ to: role === "family" ? "/cases" : "/inbox" });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { access_token } = await api.login({ email, password });
      await auth.signIn(access_token);
      toast.success("Autentificare reușită");
      nav({ to: "/cases" });
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">
          ExitusRO
        </Link>
        <h1 className="font-display text-2xl font-bold">Autentificare</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accesați-vă dosarul.</p>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.title}</AlertTitle>
            <AlertDescription className="mt-1">
              {error.message}
              {error.action?.to && (
                <div className="mt-2">
                  <Button variant="outline" size="sm" className="mt-1 gap-1" asChild>
                    <Link to={error.action.to}>
                      <UserPlus className="h-3.5 w-3.5" />
                      {error.action.label}
                    </Link>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Parolă</Label>
              <Link
                to="/auth/reset-password"
                className="text-xs font-medium text-brand-navy hover:underline"
              >
                Ați uitat parola?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-navy hover:bg-brand-navy/90"
          >
            {busy ? "Se procesează..." : "Intră în cont"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nu aveți cont?{" "}
          <Link to="/auth/signup" className="font-medium text-brand-navy hover:underline">
            Creați unul
          </Link>
        </p>

        {auth.devLoginAs && (
          <div className="mt-6 border-t border-dashed border-border pt-4">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              [DEV] Intră ca demo — testează flow-ul cross-rol
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { role: "family" as const, label: "Aparținător (familie)", hint: "Notifică medicul, urmărește pașii" },
                { role: "doctor" as const, label: "Medic constatator", hint: "Emite CMCD" },
                { role: "civil_officer" as const, label: "Funcționar Stare Civilă", hint: "Validează & emite certificat" },
                { role: "funeral_provider" as const, label: "Casă funerară", hint: "Programează înmormântarea" },
              ].map((r) => (
                <Button
                  key={r.role}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto justify-start py-2 text-left"
                  onClick={() => devSkip(r.role)}
                >
                  <div>
                    <div className="text-xs font-medium">{r.label}</div>
                    <div className="text-[10px] text-muted-foreground">{r.hint}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
