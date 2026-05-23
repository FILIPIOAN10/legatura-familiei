import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/legal";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/signup")({ component: Signup });

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("family");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) {
      const code = (error as any).code;
      if (code === "user_already_exists" || /already registered/i.test(error.message)) {
        toast.error("Există deja un cont cu acest email. Vă rugăm să vă autentificați.");
        nav({ to: "/auth/login", search: { email } as any });
        return;
      }
      return toast.error(error.message);
    }
    toast.success("Cont creat. Vă autentificăm...");
    await supabase.auth.signInWithPassword({ email, password });
    nav({ to: "/cases" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">ExitusRO</Link>
        <h1 className="font-display text-2xl font-bold">Creați un cont</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vă rugăm completați datele dvs.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label>Nume complet</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Parolă</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div>
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== "admin").map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-brand-navy hover:bg-brand-navy/90">
            {busy ? "Se procesează..." : "Creează cont"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Aveți cont? <Link to="/auth/login" className="font-medium text-brand-navy hover:underline">Autentificare</Link>
        </p>
      </div>
    </div>
  );
}
