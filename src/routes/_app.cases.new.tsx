import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createCase, type CaseType } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ROMANIAN_COUNTIES } from "@/lib/legal";

export const Route = createFileRoute("/_app/cases/new")({ component: NewCase });

function NewCase() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    cnp: "",
    birthday: "",
    datetime_of_death: new Date().toISOString().slice(0, 16),
    case_type: "violenta" as CaseType,
    place_of_death: "",
    judet: "Cluj",
    localitate: "Cluj-Napoca",
    adresa_completa: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createCase({
        ...form,
        datetime_of_death: new Date(form.datetime_of_death).toISOString(),
      });
      toast.success("Dosar creat cu succes.");
      nav({ to: "/cases/$caseId", params: { caseId: String(res.id) } });
    } catch (e: unknown) {
      const err = e as { detail?: string; message?: string };
      toast.error(err?.detail ?? err?.message ?? "Eroare la creare");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Dosar nou</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Completați datele decedatului pentru a deschide un dosar.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="nc-name">Nume complet decedat</Label>
            <Input id="nc-name" required value={form.fullname} onChange={(e) => set("fullname", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="nc-cnp">CNP</Label>
            <Input id="nc-cnp" required value={form.cnp} onChange={(e) => set("cnp", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="nc-dob">Data nașterii</Label>
            <Input id="nc-dob" type="date" required value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="nc-dod">Data și ora decesului</Label>
            <Input id="nc-dod" type="datetime-local" required value={form.datetime_of_death} onChange={(e) => set("datetime_of_death", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="nc-type">Tip caz</Label>
            <Select value={form.case_type} onValueChange={(v) => set("case_type", v)}>
              <SelectTrigger id="nc-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="violenta">Violentă</SelectItem>
                <SelectItem value="suspecta">Suspectă</SelectItem>
                <SelectItem value="necunoscuta">Necunoscută</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nc-loc">Locul decesului</Label>
            <Input id="nc-loc" required placeholder="Domiciliu / Spital / ..." value={form.place_of_death} onChange={(e) => set("place_of_death", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="nc-judet">Județ</Label>
            <Select value={form.judet} onValueChange={(v) => set("judet", v)}>
              <SelectTrigger id="nc-judet"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROMANIAN_COUNTIES.map((j) => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nc-localitate">Localitate</Label>
            <Input id="nc-localitate" required value={form.localitate} onChange={(e) => set("localitate", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="nc-addr">Adresă completă</Label>
            <Textarea id="nc-addr" required rows={2} value={form.adresa_completa} onChange={(e) => set("adresa_completa", e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border border-brand-amber/30 bg-brand-amber/5 p-4 text-xs text-foreground">
          <strong>Termen legal:</strong> 3 zile de la deces pentru declararea la Starea Civilă — <em>L. 119/1996 art. 35</em>.
        </div>

        <Button type="submit" disabled={busy} className="w-full bg-brand-navy hover:bg-brand-navy/90">
          {busy ? "Se creează dosarul..." : "Creează dosar"}
        </Button>
      </form>
    </div>
  );
}
