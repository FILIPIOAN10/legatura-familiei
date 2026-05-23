import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { seedDemo } from "@/lib/seed.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/seed")({ component: SeedPage });

function SeedPage() {
  const fn = useServerFn(seedDemo);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setBusy(true);
    try {
      const r = await fn();
      setResult(r);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Date demo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Creează conturi demo (familie, medic, funcționar, notar, casă funerară, admin) și un caz în starea „CMCD emis" pentru a demonstra fluxul end-to-end.
      </p>

      <Button onClick={run} disabled={busy} className="mt-6 bg-brand-navy hover:bg-brand-navy/90">
        {busy ? "Se generează..." : "Generează date demo"}
      </Button>

      {result?.accounts && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display font-semibold">Conturi create</h2>
          <p className="mb-4 text-sm text-muted-foreground">Parolă pentru toate: <code className="rounded bg-muted px-2 py-1 font-mono">{result.password}</code></p>
          <ul className="space-y-2">
            {result.accounts.map((a: any) => (
              <li key={a.email} className="flex justify-between text-sm">
                <code className="font-mono">{a.email}</code>
                <span className="text-muted-foreground">{a.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result?.error && (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error}
        </div>
      )}
    </div>
  );
}
