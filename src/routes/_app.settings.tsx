import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

type SetupState =
  | { phase: "idle" }
  | { phase: "pending"; secret: string; uri: string }
  | { phase: "done" };

function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-navy">Setări cont</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestionați securitatea contului dvs.</p>
      </div>
      <TwoFactorSection />
    </div>
  );
}

function TwoFactorSection() {
  const [setup, setSetup] = useState<SetupState>({ phase: "idle" });
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSetup = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.setup2fa();
      setSetup({ phase: "pending", secret: res.secret, uri: res.uri });
      setEnableCode("");
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setError(err?.detail ?? "Eroare la inițializarea 2FA.");
    } finally {
      setBusy(false);
    }
  };

  const enable = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enableCode.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await api.enable2fa(enableCode);
      setSetup({ phase: "done" });
      toast.success("Autentificarea în doi pași a fost activată.");
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setError(err?.detail ?? "Cod incorect. Verificați aplicația și încercați din nou.");
      setEnableCode("");
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disableCode.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await api.disable2fa(disableCode);
      setSetup({ phase: "idle" });
      setShowDisable(false);
      setDisableCode("");
      toast.success("Autentificarea în doi pași a fost dezactivată.");
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setError(err?.detail ?? "Cod incorect. Verificați aplicația și încercați din nou.");
      setDisableCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-brand-navy" />
          <div>
            <h2 className="font-display font-semibold">Autentificare în doi pași (2FA)</h2>
            <p className="text-sm text-muted-foreground">Protejați contul cu o aplicație TOTP (Google Authenticator, Authy etc.)</p>
          </div>
        </div>
        {setup.phase === "done" && (
          <Badge className="bg-brand-sage text-white gap-1">
            <CheckCircle2 className="size-3" /> Activat
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {setup.phase === "idle" && (
        <div className="space-y-4">
          <Button onClick={startSetup} disabled={busy} className="bg-brand-navy hover:bg-brand-navy/90">
            {busy ? "Se inițializează..." : "Configurează 2FA"}
          </Button>
          <div className="border-t border-border pt-4">
            {!showDisable ? (
              <button
                type="button"
                onClick={() => { setShowDisable(true); setError(null); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
              >
                <ShieldOff className="size-4" /> Dezactivează 2FA
              </button>
            ) : (
              <form onSubmit={disable} className="space-y-4">
                <p className="text-sm font-medium">Introduceți codul din aplicație pentru a dezactiva 2FA:</p>
                <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode} disabled={busy}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex gap-3">
                  <Button type="submit" variant="destructive" disabled={busy || disableCode.length !== 6}>
                    {busy ? "Se dezactivează..." : "Dezactivează"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowDisable(false); setDisableCode(""); setError(null); }}>
                    Anulează
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {setup.phase === "pending" && (
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium">
              1. Scanați codul QR cu aplicația dvs. de autentificare:
            </p>
            <div className="inline-block rounded-lg border border-border bg-white p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.uri)}`}
                alt="QR Code 2FA"
                width={180}
                height={180}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Sau introduceți cheia manuală:</p>
            <code className="block rounded-md bg-muted px-4 py-2 font-mono text-sm tracking-widest select-all">
              {setup.secret}
            </code>
          </div>

          <form onSubmit={enable} className="space-y-4">
            <div>
              <p className="mb-3 text-sm font-medium">
                2. Introduceți codul de 6 cifre generat de aplicație pentru a confirma:
              </p>
              <InputOTP maxLength={6} value={enableCode} onChange={setEnableCode} disabled={busy}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={busy || enableCode.length !== 6}
                className="bg-brand-navy hover:bg-brand-navy/90"
              >
                {busy ? "Se activează..." : "Activează 2FA"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setSetup({ phase: "idle" }); setError(null); }}>
                Anulează
              </Button>
            </div>
          </form>
        </div>
      )}

      {setup.phase === "done" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Autentificarea în doi pași este activă. La următoarea autentificare veți fi solicitat să introduceți codul din aplicație.
          </p>
          <button
            type="button"
            onClick={() => { setSetup({ phase: "idle" }); setShowDisable(true); setError(null); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
          >
            <ShieldOff className="size-4" /> Dezactivează 2FA
          </button>
        </div>
      )}
    </section>
  );
}
