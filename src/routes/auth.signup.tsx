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
import { AlertCircle, Check, Heart, Stethoscope, Building2, FileText, Mail, KeyRound, User, UserPlus, ArrowRight } from "lucide-react";

const SELECTABLE_ROLES: { value: RegisterPayload["role"]; label: string; hint: string }[] = [
  { value: "family", label: "Aparținător (familie)", hint: "Deschideți dosarul, urmăriți pașii" },
  { value: "doctor", label: "Medic constatator", hint: "Eliberați CMCD" },
  { value: "funeral_provider", label: "Casă funerară", hint: "Programați înmormântarea" },
  { value: "notary", label: "Notar public", hint: "Procedura succesorală" },
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
            Creează cont și scapă de drumuri.
          </h2>
          <p className="text-base text-white/80 leading-relaxed font-medium">
            Conectăm toți actorii implicați în procedurile de stare civilă și funerare pentru a reduce timpul de procesare de la zile la ore. Un cont pentru respect, claritate și sprijin reciproc.
          </p>

          <div className="space-y-4 pt-4">
            {[
              "Completare rapidă a datelor online, fără drumuri inutile.",
              "Notificare automată către medicul constatator și casă funerară.",
              "Păstrarea documentelor în deplină siguranță și conformitate GDPR.",
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
        <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border/40 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-10">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Mobile-only logo */}
            <Link to="/" className="mb-4 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-navy font-display text-xs font-bold text-white tracking-wider">
                EX
              </div>
              <span className="font-display text-lg font-bold text-brand-navy">ExitusRO</span>
            </Link>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
              Creează un cont
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground font-medium">
              Conturile de funcționar Stare Civilă se configurează exclusiv administrativ.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/50 text-red-900 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="font-bold">Eroare</AlertTitle>
              <AlertDescription className="mt-1 text-xs font-medium text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nume Complet
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    id="signup-name"
                    required
                    placeholder="Popescu Ion"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10.5 border-border/80 focus-visible:ring-brand-navy"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nume Utilizator
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                  </span>
                  <Input
                    id="signup-username"
                    required
                    minLength={3}
                    pattern="[a-zA-Z0-9_.-]+"
                    placeholder="popescu.ion"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-10.5 border-border/80 focus-visible:ring-brand-navy"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Adresă Email
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="popescu@exemplu.ro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10.5 border-border/80 focus-visible:ring-brand-navy"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Parolă cont
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                </span>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-10.5 border-border/80 focus-visible:ring-brand-navy"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">Minimum 8 caractere.</p>
            </div>

            <div className="space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rolul tău în platformă
              </Label>

              <div className="grid grid-cols-2 gap-3">
                {SELECTABLE_ROLES.map((r) => {
                  const Icon = r.value === "family" ? Heart
                             : r.value === "doctor" ? Stethoscope
                             : r.value === "funeral_provider" ? Building2
                             : FileText;
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden group select-none ${
                        active
                          ? "border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy"
                          : "border-border/60 hover:border-border hover:bg-muted/10"
                      }`}
                    >
                      {active && (
                        <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-brand-navy text-white">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className={`p-1.5 rounded-lg mb-2.5 ${active ? "bg-brand-navy/10 text-brand-navy" : "bg-muted text-muted-foreground group-hover:bg-muted/80"}`}>
                        <Icon className="size-4" />
                      </div>
                      <span className={`text-xs font-bold ${active ? "text-brand-navy" : "text-foreground"}`}>
                        {r.label.split(" (")[0]}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        {r.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold rounded-lg shadow-md shadow-brand-navy/10 hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
            >
              {busy ? "Se creează contul..." : (
                <>
                  Creează cont <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm font-medium text-muted-foreground">
            Ai deja un cont ExitusRO?{" "}
            <Link to="/auth/login" className="font-semibold text-brand-navy hover:underline">
              Autentifică-te
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
