import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Autentificare reușită");
    nav({ to: "/cases" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">ExitusRO</Link>
        <h1 className="font-display text-2xl font-bold">Autentificare</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accesați-vă dosarul.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Parolă</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={busy} className="w-full bg-brand-navy hover:bg-brand-navy/90">
            {busy ? "Se procesează..." : "Intră în cont"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nu aveți cont? <Link to="/auth/signup" className="font-medium text-brand-navy hover:underline">Creați unul</Link>
        </p>
      </div>
    </div>
  );
}
