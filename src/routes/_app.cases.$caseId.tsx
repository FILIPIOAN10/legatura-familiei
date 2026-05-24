import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getCase, updateCase, deleteCase, type UpdateCasePayload, type CaseType } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatDateTimeRo } from "@/lib/format";
import { ROMANIAN_COUNTIES } from "@/lib/legal";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/cases/$caseId")({ component: CaseDetail });

const CASE_TYPE_LABELS: Record<string, string> = {
  violenta: "Violentă",
  suspecta: "Suspectă",
  necunoscuta: "Necunoscută",
};

function CaseDetail() {
  const { caseId } = Route.useParams();
  const id = parseInt(caseId, 10);
  const { data: c, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCase(id),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă dosarul...</p>;
  if (!c) return <p>Dosar inexistent.</p>;

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Badge className="bg-brand-navy text-white font-mono">#{c.id}</Badge>
          <span className="text-sm text-muted-foreground">
            {CASE_TYPE_LABELS[c.case_type] ?? c.case_type}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">{c.fullname}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deces: {formatDateTimeRo(c.datetime_of_death)} • {c.localitate}, {c.judet}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Date dosar</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Nume complet</dt><dd className="font-medium">{c.fullname}</dd></div>
              <div><dt className="text-muted-foreground">CNP</dt><dd className="font-mono">{c.cnp}</dd></div>
              <div><dt className="text-muted-foreground">Data nașterii</dt><dd>{c.birthday}</dd></div>
              <div><dt className="text-muted-foreground">Data decesului</dt><dd>{formatDateTimeRo(c.datetime_of_death)}</dd></div>
              <div><dt className="text-muted-foreground">Tip caz</dt><dd>{CASE_TYPE_LABELS[c.case_type] ?? c.case_type}</dd></div>
              <div><dt className="text-muted-foreground">Locul decesului</dt><dd>{c.place_of_death}</dd></div>
              <div><dt className="text-muted-foreground">Județ</dt><dd>{c.judet}</dd></div>
              <div><dt className="text-muted-foreground">Localitate</dt><dd>{c.localitate}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Adresă completă</dt><dd>{c.adresa_completa}</dd></div>
            </dl>
          </div>

          <div className="flex gap-3">
            <EditCaseDialog caseId={caseId} current={c} />
            <DeleteCaseButton caseId={id} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 text-sm space-y-2">
            <h3 className="font-display font-semibold mb-3">Informații</h3>
            <p className="text-muted-foreground">Creat: <span className="text-foreground">{formatDateTimeRo(c.created_at)}</span></p>
            <p className="text-muted-foreground">Actualizat: <span className="text-foreground">{formatDateTimeRo(c.updated_at)}</span></p>
            <p className="text-muted-foreground">ID utilizator: <span className="font-mono text-foreground">{c.user_id}</span></p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EditCaseDialog({ caseId, current }: { caseId: string; current: UpdateCasePayload & { id: number; case_type: CaseType; fullname: string; cnp: string; birthday: string; datetime_of_death: string; place_of_death: string; judet: string; localitate: string; adresa_completa: string } }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullname: current.fullname ?? "",
    cnp: current.cnp ?? "",
    birthday: current.birthday ?? "",
    datetime_of_death: current.datetime_of_death ? current.datetime_of_death.slice(0, 16) : "",
    case_type: current.case_type ?? "violenta",
    place_of_death: current.place_of_death ?? "",
    judet: current.judet ?? "",
    localitate: current.localitate ?? "",
    adresa_completa: current.adresa_completa ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: (data: UpdateCasePayload) => updateCase(current.id, data),
    onSuccess: () => {
      toast.success("Dosar actualizat.");
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      setOpen(false);
    },
    onError: (e: unknown) => {
      const err = e as { detail?: string };
      toast.error(err?.detail ?? "Eroare la actualizare");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Pencil className="size-4" /> Editează</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editează dosar</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div><Label>Nume complet</Label><Input value={form.fullname} onChange={(e) => set("fullname", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CNP</Label><Input value={form.cnp} onChange={(e) => set("cnp", e.target.value)} /></div>
            <div><Label>Data nașterii</Label><Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} /></div>
          </div>
          <div><Label>Data și ora decesului</Label><Input type="datetime-local" value={form.datetime_of_death} onChange={(e) => set("datetime_of_death", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tip caz</Label>
              <Select value={form.case_type} onValueChange={(v) => set("case_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="violenta">Violentă</SelectItem>
                  <SelectItem value="suspecta">Suspectă</SelectItem>
                  <SelectItem value="necunoscuta">Necunoscută</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Locul decesului</Label><Input value={form.place_of_death} onChange={(e) => set("place_of_death", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Județ</Label>
              <Select value={form.judet} onValueChange={(v) => set("judet", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROMANIAN_COUNTIES.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Localitate</Label><Input value={form.localitate} onChange={(e) => set("localitate", e.target.value)} /></div>
          </div>
          <div><Label>Adresă completă</Label><Textarea rows={2} value={form.adresa_completa} onChange={(e) => set("adresa_completa", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mut.mutate({ ...form, datetime_of_death: new Date(form.datetime_of_death).toISOString() })}
            disabled={mut.isPending}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {mut.isPending ? "Se salvează..." : "Salvează"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCaseButton({ caseId }: { caseId: number }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const mut = useMutation({
    mutationFn: () => deleteCase(caseId),
    onSuccess: () => {
      toast.success("Dosar șters.");
      nav({ to: "/cases" });
    },
    onError: (e: unknown) => {
      const err = e as { detail?: string };
      toast.error(err?.detail ?? "Eroare la ștergere");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
          <Trash2 className="size-4" /> Șterge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Șterge dosarul?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Această acțiune este ireversibilă.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Anulează</Button>
          <Button variant="destructive" onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Se șterge..." : "Șterge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
