import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { api, isAuthenticated } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { MailCheck, AlertCircle, ArrowLeft, Mail, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/auth/reset-password")({
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/cases" });
  },
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

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
      toast.success("Email de resetare trimis! Verificați inbox-ul.");
    } catch (err: any) {
      setError(err?.detail ?? "Nu s-a putut trimite emailul de resetare. Încercați mai târziu.");
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
            Recuperare acces cont.
          </h2>
          <p className="text-base text-white/80 leading-relaxed font-medium">
            Procedurile post-deces necesită atenție și precizie. Te ajutăm să recuperezi accesul la dosarul tău în siguranță, garantând confidențialitatea completă a datelor.
          </p>

          <div className="space-y-4 pt-4">
            {[
              "Recuperare securizată prin link temporar trimis pe email.",
              "Conexiuni criptate și stocare securizată a datelor personale.",
              "Suport dedicat pentru asistență în gestionarea contului.",
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
          {sent ? (
            <div className="text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100">
                <MailCheck className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy">
                  Verifică email-ul
                </h1>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Am trimis un link de resetare a parolei la adresa <strong className="text-brand-navy font-semibold">{email}</strong>.
                  Verifică inbox-ul (și folderul Spam) și urmează instrucțiunile primite.
                </p>
              </div>
              <Button variant="outline" className="w-full h-11 border-border/80 text-brand-navy hover:bg-brand-muted/40 font-semibold gap-2" asChild>
                <Link to="/auth/login">
                  <ArrowLeft className="h-4 w-4" />
                  Înapoi la autentificare
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Mobile-only logo */}
                <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-navy font-display text-xs font-bold text-white tracking-wider">
                    EX
                  </div>
                  <span className="font-display text-lg font-bold text-brand-navy">ExitusRO</span>
                </Link>

                <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
                  Resetare parolă
                </h1>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  Introdu email-ul tău pentru a primi link-ul de resetare.
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

              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Adresă Email
                  </Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      id="reset-email"
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

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold rounded-lg shadow-md shadow-brand-navy/10 hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
                >
                  {busy ? "Se trimite..." : (
                    <>
                      Trimite link resetare <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm font-medium text-muted-foreground pt-2">
                Îți amintești parola?{" "}
                <Link to="/auth/login" className="font-semibold text-brand-navy hover:underline">
                  Autentifică-te
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

