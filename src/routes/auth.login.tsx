import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Mail, ArrowRight, UserPlus } from "lucide-react";

type ErrorType =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_not_found"
  | "rate_limited"
  | "network_error"
  | "unknown";

interface AuthError {
  type: ErrorType;
  title: string;
  message: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

function parseAuthError(error: any, email: string): AuthError {
  const code = error?.code || "";
  const msg = error?.message || "";

  if (code === "email_not_confirmed" || /email.*not.*confirmed/i.test(msg)) {
    return {
      type: "email_not_confirmed",
      title: "Email neconfirmat",
      message:
        "Contul a fost creat, dar adresa de email nu a fost validată încă. Verificați inbox-ul (și folderul Spam) pentru emailul de confirmare.",
      action: { label: "Retrimite email de confirmare" },
    };
  }

  if (
    code === "invalid_credentials" ||
    code === "user_not_found" ||
    /invalid.*credentials/i.test(msg) ||
    /user.*not.*found/i.test(msg) ||
    /invalid.*login/i.test(msg)
  ) {
    return {
      type: "invalid_credentials",
      title: "Date de autentificare incorecte",
      message:
        "Email-ul sau parola introdusă nu sunt corecte. Verificați tasta Caps Lock și încercați din nou.",
      action: { label: "Creează cont nou", to: "/auth/signup" },
    };
  }

  if (code === "rate_limit" || /rate.*limit/i.test(msg) || /too.*many.*request/i.test(msg)) {
    return {
      type: "rate_limited",
      title: "Prea multe încercări",
      message:
        "Ați încercat să vă autentificați de prea multe ori. Așteptați câteva minute înainte de a încerca din nou.",
    };
  }

  if (code === "network_error" || /network/i.test(msg) || /fetch/i.test(msg) || !navigator.onLine) {
    return {
      type: "network_error",
      title: "Problemă de conexiune",
      message:
        "Nu s-a putut conecta la server. Verificați conexiunea la internet și încercați din nou.",
    };
  }

  return {
    type: "unknown",
    title: "Eroare la autentificare",
    message: msg || "A apărut o eroare necunoscută. Încercați din nou mai târziu.",
  };
}

export const Route = createFileRoute("/auth/login")({
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const nav = useNavigate();

  const resendConfirmation = async () => {
    if (!email) return;
    setBusy(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setBusy(false);
    if (resendError) {
      toast.error(resendError.message || "Nu s-a putut retrimite emailul. Încercați mai târziu.");
    } else {
      toast.success("Email de confirmare retrimis! Verificați inbox-ul.");
      setError(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (signInError) {
      const parsed = parseAuthError(signInError, email);
      setError(parsed);
      return;
    }

    toast.success("Autentificare reușită");
    nav({ to: "/cases" });
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
              {error.action && (
                <div className="mt-2">
                  {error.type === "email_not_confirmed" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 gap-1"
                      onClick={resendConfirmation}
                      disabled={busy}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {error.action.label}
                    </Button>
                  ) : error.action.to ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 gap-1"
                      asChild
                    >
                      <Link to={error.action.to}>
                        <UserPlus className="h-3.5 w-3.5" />
                        {error.action.label}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 gap-1"
                      onClick={error.action.onClick}
                      disabled={busy}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {error.action.label}
                    </Button>
                  )}
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
      </div>
    </div>
  );
}
