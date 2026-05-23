import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createCase } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cases/new")({ component: NewCase });

function NewCase() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    deceased_full_name: "",
    deceased_dob: "",
    deceased_dod: new Date().toISOString().slice(0, 16),
    death_location: "",
    death_cause_type: "natural" as "natural" | "violent" | "suspect" | "unknown",
    city: "Cluj-Napoca",
    county: "Cluj",
    address: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createCase({ ...form, deceased_dod: new Date(form.deceased_dod).toISOString() });
      toast.success("Dosar creat. Medicul a fost notificat.");
      nav({ to: "/cases/$caseId", params: { caseId: res.case.id } });
    } catch (e: any) {
      toast.error(e?.detail ?? e?.message ?? "Eroare la creare");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Notifică medicul</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Completați datele decedatului. La trimitere se deschide automat dosarul și medicul
        constatator este notificat. Veți putea atașa documente ulterior.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label htmlFor="nc-name">Nume complet decedat</Label><Input id="nc-name" required value={form.deceased_full_name} onChange={(e) => set("deceased_full_name", e.target.value)} /></div>
          <div><Label htmlFor="nc-dob">Data nașterii</Label><Input id="nc-dob" type="date" value={form.deceased_dob} onChange={(e) => set("deceased_dob", e.target.value)} /></div>
          <div><Label htmlFor="nc-dod">Data și ora decesului</Label><Input id="nc-dod" type="datetime-local" required value={form.deceased_dod} onChange={(e) => set("deceased_dod", e.target.value)} /></div>
          <div>
            <Label htmlFor="nc-type">Tip caz</Label>
            <Select value={form.death_cause_type} onValueChange={(v) => set("death_cause_type", v)}>
              <SelectTrigger id="nc-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Cauză naturală</SelectItem>
                <SelectItem value="violent">Violentă (se redirectează la IML)</SelectItem>
                <SelectItem value="suspect">Suspectă</SelectItem>
                <SelectItem value="unknown">Necunoscută</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">Cazurile violente/suspecte impun expertiză IML.</p>
          </div>
          <div><Label htmlFor="nc-loc">Locul decesului</Label><Input id="nc-loc" placeholder="Domiciliu / Spital / ..." value={form.death_location} onChange={(e) => set("death_location", e.target.value)} /></div>
          <div>
            <Label htmlFor="nc-county">Județ</Label>
            <Input id="nc-county" value="Cluj" readOnly disabled />
          </div>
          <div><Label htmlFor="nc-city">Localitate</Label><Input id="nc-city" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="md:col-span-2"><Label htmlFor="nc-addr">Adresă completă</Label><Textarea id="nc-addr" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        </div>

        <div className="rounded-lg border border-brand-amber/30 bg-brand-amber/5 p-4 text-xs text-foreground">
          <strong>Termen legal:</strong> 3 zile de la deces pentru declararea la Starea Civilă — <em>L. 119/1996 art. 35</em>.
        </div>

        <Button type="submit" disabled={busy} className="w-full bg-brand-navy hover:bg-brand-navy/90">
          {busy ? "Se trimite notificarea..." : "Notifică medicul"}
        </Button>
      </form>
    </div>
  );
}
