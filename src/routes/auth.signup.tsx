import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/legal";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Creați cont — ExitusRO" },
      { name: "description", content: "Creați un cont ExitusRO pentru a deschide un dosar post-deces." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [email, setEmail] = useState("test@example.com");
  const [username, setUsername] = useState("test_user");
  const [fullName, setFullName] = useState("Ion Popescu");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("family");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { access_token } = await api.register({
        email,
        username,
        full_name: fullName,
        password,
        role,
      });
      await auth.signIn(access_token);
      toast.success("Cont creat cu succes.");
      nav({ to: "/cases" });
    } catch (err: any) {
      const detail = err?.detail ?? err?.message ?? "Eroare la crearea contului.";
      if (/already|exists|duplicate/i.test(detail)) {
        toast.error("Există deja un cont cu acest email. Vă rugăm să vă autentificați.");
        nav({ to: "/auth/login" });
      } else {
        toast.error(detail);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">ExitusRO</Link>
        <h1 className="font-display text-2xl font-bold">Creați un cont</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vă rugăm completați datele dvs.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="signup-name">Nume complet</Label>
            <Input id="signup-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-username">Nume de utilizator</Label>
            <Input id="signup-username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-password">Parolă</Label>
            <Input id="signup-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-role">Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="signup-role"><SelectValue /></SelectTrigger>
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
