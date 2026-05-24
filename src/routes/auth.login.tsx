import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { isAuthenticated, type ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, UserPlus, Check, Mail, KeyRound, ArrowRight } from "lucide-react";

interface AuthError {
  title: string;
  message: string;
  action?: { label: string; to?: string };
}

function parseError(err: unknown): AuthError {
  const e = err as ApiError;
  const detail = typeof e?.detail === "string" ? e.detail.toLowerCase() : "";

  if (e?.status === 401 || /incorrect|invalid|wrong|password|credentials|bad/i.test(detail)) {
    return {
      title: "Date de autentificare incorecte",
      message:
        "Email-ul sau parola introdusă nu sunt corecte. Verificați tasta Caps Lock și încercați din nou.",
      action: { label: "Creează cont nou", to: "/auth/signup" },
    };
  }
  if (e?.status === 429 || /rate|too many/i.test(detail)) {
    return {
      title: "Prea multe încercări",
      message:
        "Ați încercat de prea multe ori. Așteptați câteva minute înainte de a încerca din nou.",
    };
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      title: "Problemă de conexiune",
      message:
        "Nu s-a putut conecta la server. Verificați conexiunea la internet și încercați din nou.",
    };
  }
  if (e?.status === 0 || /network|fetch|failed to fetch/i.test(detail)) {
    return {
      title: "Serverul nu răspunde",
      message:
        "Nu se poate conecta la backend. Verificați că serverul rulează pe portul 8000.",
    };
  }
  return {
    title: "Eroare la autentificare",
    message: (e as { detail?: string })?.detail || "A apărut o eroare necunoscută. Încercați din nou mai târziu.",
  };
}

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/cases" });
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
  const [email, setEmail] = useState("admin@exitusro.ro");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const auth = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await auth.signIn(email, password);
      toast.success("Autentificare reușită");
      nav({ to: "/cases" });
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left branding pane - hidden on mobile */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-navy via-[#1e2d4a] to-[#121c2e] p-12 text-white lg:flex overflow-hidden">
        {/* Glowing Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-brand-sage/10 blur-[100px] animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-brand-navy/40 blur-[120px] animate-pulse duration-[6000ms]" />
        </div>

        {/* Top area */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 select-none group">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-white font-display text-xs font-bold text-brand-navy tracking-wider transition-transform group-hover:scale-105">
              EX
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">ExitusRO</span>
          </Link>
        </div>

        {/* Middle content */}
        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-sage">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-sage animate-ping" />
            Digitalizarea procedurilor post-deces
          </span>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            Alături de tine în momentele dificile.
          </h2>
          <p className="text-base text-white/80 leading-relaxed font-medium">
            Simplificăm birocrația post-deces pentru ca tu să te poți concentra pe ceea ce contează cu adevărat. O platformă sigură, ghidată de legislația din România, creată cu respect și decență.
          </p>

          <div className="space-y-4 pt-4">
            {[
              "Dosar electronic unificat pentru aparținători, medici și starea civilă.",
              "Monitorizarea automată a termenelor legale (L. 119/1996 art. 35).",
              "Semnătură electronică pentru documentele medicale (CMCD).",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-sage/20 text-brand-sage">
                  <Check className="size-3 stroke-[3]" />
                </div>
                <span className="text-sm font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom area */}
        <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60 font-medium">
          <span>L. 119/1996 — Starea Civilă</span>
          <span>L. 102/2014 — Servicii Funerare</span>
          <span>GDPR Compliant</span>
        </div>
      </div>

      {/* Right form pane */}
      <div className="flex items-center justify-center bg-brand-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/40 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-10">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Mobile-only logo */}
            <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-navy font-display text-xs font-bold text-white tracking-wider">
                EX
              </div>
              <span className="font-display text-lg font-bold text-brand-navy">ExitusRO</span>
            </Link>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
              Autentificare
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Introdu datele contului tău pentru a accesa dosarul.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/50 text-red-900 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="font-bold">{error.title}</AlertTitle>
              <AlertDescription className="mt-1 text-xs font-medium text-red-800">
                {error.message}
                {error.action?.to && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="bg-white border-red-200 hover:bg-red-50 text-red-900 gap-1.5" asChild>
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

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Adresă Email
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nume@exemplu.ro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-border/80 focus-visible:ring-brand-navy"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Parolă
                </Label>
                <Link
                  to="/auth/reset-password"
                  className="text-xs font-semibold text-brand-navy hover:text-brand-navy/80 hover:underline"
                >
                  Ai uitat parola?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                </span>
                <Input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-border/80 focus-visible:ring-brand-navy"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold rounded-lg shadow-md shadow-brand-navy/10 hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {busy ? "Se procesează..." : (
                <>
                  Intră în cont <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm font-medium text-muted-foreground pt-2">
            Nu ai un cont ExitusRO?{" "}
            <Link to="/auth/signup" className="font-semibold text-brand-navy hover:underline">
              Înregistrează-te
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

