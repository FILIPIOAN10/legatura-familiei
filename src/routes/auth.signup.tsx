import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { hasAuthCookie, type ApiError, type RegisterPayload } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const SELECTABLE_ROLES: { value: RegisterPayload["role"]; label: string; hint: string }[] = [
  { value: "family", label: "Aparținător (familie)", hint: "Deschideți dosarul, urmăriți pașii" },
  { value: "doctor", label: "Medic constatator", hint: "Eliberați CMCD" },
  { value: "funeral_provider", label: "Casă funerară", hint: "Programați înmormântarea" },
  { value: "notary", label: "Notar public", hint: "Deschideți procedura succesorală" },
];

export const Route = createFileRoute("/auth/signup")({
  beforeLoad: () => {
    if (hasAuthCookie()) throw redirect({ to: "/cases" });
  },
  head: () => ({
    meta: [
      { title: "Creați cont — ExitusRO" },
      { name: "description", content: "Creați un cont ExitusRO." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterPayload["role"]>("family");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await auth.signUp({
        email: email.trim(),
        username: username.trim(),
        full_name: fullName.trim(),
        password,
        role,
      });
      toast.success("Cont creat cu succes.");
      nav({ to: "/cases" });
    } catch (err) {
      const e = err as ApiError;
      if (e?.status === 409 || /exists|already|duplicate/i.test(e?.detail ?? "")) {
        setError("Există deja un cont cu acest email.");
      } else if (e?.status === 400) {
        setError(e.detail || "Date invalide. Verificați câmpurile.");
      } else {
        setError(e?.detail || "A apărut o eroare la crearea contului.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">
          ExitusRO
        </Link>
        <h1 className="font-display text-2xl font-bold">Creați un cont</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conturile de funcționar Stare Civilă se obțin doar prin administrator.
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
            <Label htmlFor="signup-name">Nume complet</Label>
            <Input
              id="signup-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="signup-username">Nume de utilizator</Label>
            <Input
              id="signup-username"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_.-]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Doar litere, cifre și caracterele <code>. _ -</code>.
            </p>
          </div>
          <div>
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="signup-password">Parolă</Label>
            <Input
              id="signup-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Minimum 8 caractere.</p>
          </div>
          <div>
            <Label htmlFor="signup-role">Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RegisterPayload["role"])}>
              <SelectTrigger id="signup-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col items-start">
                      <span>{r.label}</span>
                      <span className="text-[10px] text-muted-foreground">{r.hint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-navy hover:bg-brand-navy/90"
          >
            {busy ? "Se procesează..." : "Creează cont"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Aveți cont?{" "}
          <Link to="/auth/login" className="font-medium text-brand-navy hover:underline">
            Autentificare
          </Link>
        </p>
      </div>
    </div>
  );
}
