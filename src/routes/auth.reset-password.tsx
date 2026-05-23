import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { MailCheck, AlertCircle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Resetare parolă — ExitusRO" },
      { name: "description", content: "Resetați parola contului ExitusRO." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Email de resetare trimis! Verificați inbox-ul.");
    } catch (err: any) {
      setError(err?.detail ?? "Nu s-a putut trimite emailul de resetare. Încercați mai târziu.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
          <MailCheck className="mx-auto h-10 w-10 text-green-600 mb-4" />
          <h1 className="font-display text-xl font-bold">Verificați email-ul</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Am trimis un link de resetare a parolei la <strong>{email}</strong>.
            Verificați inbox-ul (și folderul Spam) și urmați instrucțiunile.
          </p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-navy hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Înapoi la autentificare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">
          ExitusRO
        </Link>
        <h1 className="font-display text-2xl font-bold">Resetare parolă</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Introduceți email-ul asociat contului și vă trimitem un link de resetare.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Eroare</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-navy hover:bg-brand-navy/90"
          >
            {busy ? "Se trimite..." : "Trimite link de resetare"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          V-ați amintit parola?{" "}
          <Link to="/auth/login" className="font-medium text-brand-navy hover:underline">
            Autentificare
          </Link>
        </p>
      </div>
    </div>
  );
}
