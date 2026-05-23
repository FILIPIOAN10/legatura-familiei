import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getCase, issueCmcd, validateAndIssueDeathCert, requestCorrections, scheduleFuneral, completeFuneral, openSuccession, closeSuccession } from "@/lib/cases.functions";
import { uploadDocument, getDocumentDownloadUrl } from "@/lib/documents.functions";
import { CaseStepper } from "@/components/case-stepper";
import { DeadlineCard } from "@/components/deadline-card";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CASE_STATUS_LABELS, DOC_TYPE_LABELS } from "@/lib/legal";
import { formatDateTimeRo, maskCnp } from "@/lib/format";
import { toast } from "sonner";
import { FileText, Stethoscope, Building2, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/_app/cases/$caseId")({ component: CaseDetail });

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCase(caseId),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă dosarul...</p>;
  if (!data?.case) return <p>Dosar inexistent.</p>;

  const c = data.case;
  const nextDeadline = data.tasks.find((t) => t.legal_deadline && t.status !== "done");

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Badge className="bg-brand-navy text-white">Caz activ</Badge>
          <span className="text-sm text-muted-foreground">Dosar: <span className="font-mono">{c.case_number}</span></span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">{c.deceased_full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CNP: {maskCnp(c.deceased_cnp)} • Deces: {formatDateTimeRo(c.deceased_dod)} • {c.city ?? "—"}, {c.county ?? "—"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CaseStepper current={c.status} />

          <ActionPanel caseData={c} />

          <DocumentVault docs={data.documents} caseId={c.id} />
        </div>

        <aside className="space-y-6">
          {nextDeadline?.legal_deadline && (
            <DeadlineCard
              deadline={nextDeadline.legal_deadline}
              legalRef={nextDeadline.legal_reference ?? ""}
              label={nextDeadline.title}
            />
          )}

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-display font-semibold">Sarcini</h3>
            <ul className="space-y-3">
              {data.tasks.map((t) => (
                <li key={t.id} className="flex gap-3 text-sm">
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${t.status === "done" ? "bg-brand-sage" : "bg-muted-foreground/40"}`} />
                  <div>
                    <p className="font-medium">{t.title}</p>
                    {t.legal_reference && <p className="text-[11px] text-muted-foreground">{t.legal_reference}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-3 font-display font-semibold">Jurnal acțiuni</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {data.audit.map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-foreground">{a.action}</span> — {formatDateTimeRo(a.created_at)}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActionPanel({ caseData }: { caseData: any }) {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["case", caseData.id] });

  const issueM = useMutation({
    mutationFn: issueCmcd,
    onSuccess: () => { toast.success("CMCD emis și transmis la Starea Civilă."); invalidate(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const validateM = useMutation({
    mutationFn: validateAndIssueDeathCert,
    onSuccess: (r: any) => { toast.success(`Certificat ${r.certificate_number} emis.`); invalidate(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const correctionsM = useMutation({
    mutationFn: requestCorrections,
    onSuccess: () => { toast.success("Solicitare trimisă."); invalidate(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });

  if (role === "doctor" && caseData.status === "AWAITING_DOCTOR") {
    return (
      <DoctorIssueForm
        onSubmit={(d) => issueM.mutate({ case_id: caseData.id, ...d })}
        busy={issueM.isPending}
      />
    );
  }

  if (role === "civil_officer" && (caseData.status === "CMCD_ISSUED" || caseData.status === "AWAITING_CIVIL_OFFICER")) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="size-5 text-brand-navy" />
          <h2 className="font-display text-lg font-semibold">Validare la Starea Civilă</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Verificați CMCD-ul și actele anexate. La validare se generează automat certificatul de deces și adeverința de înhumare.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => validateM.mutate({ case_id: caseData.id })}
            disabled={validateM.isPending}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {validateM.isPending ? "Se procesează..." : "Aprobă și emite certificat de deces"}
          </Button>
          <CorrectionsDialog onSubmit={(reason) => correctionsM.mutate({ case_id: caseData.id, reason })} />
        </div>
      </div>
    );
  }

  if (role === "funeral_provider" && (caseData.status === "DEATH_CERT_ISSUED" || caseData.status === "FUNERAL_SCHEDULED")) {
    return <FuneralPanel caseData={caseData} onScheduled={invalidate} onCompleted={invalidate} />;
  }

  if (role === "notary" && (caseData.status === "DEATH_CERT_ISSUED" || caseData.status === "FUNERAL_COMPLETED" || caseData.status === "SUCCESSION_OPEN")) {
    return <NotaryPanel caseData={caseData} onChanged={invalidate} />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-2 font-display text-lg font-semibold">Status curent</h2>
      <p className="text-sm text-muted-foreground">
        Cazul este în starea: <strong className="text-brand-navy">{CASE_STATUS_LABELS[caseData.status]}</strong>.
        {role === "family" && caseData.status === "AWAITING_DOCTOR" && " Medicul a fost notificat. Așteptăm emiterea CMCD."}
        {role === "family" && caseData.status === "CMCD_ISSUED" && " CMCD-ul a fost emis. Funcționarul de stare civilă urmează să valideze și să emită certificatul de deces."}
        {role === "family" && caseData.status === "DEATH_CERT_ISSUED" && ` Certificatul de deces ${caseData.certificate_number ?? ""} este disponibil. Puteți contacta o casă funerară.`}
        {role === "family" && caseData.status === "FUNERAL_SCHEDULED" && " Casa funerară a programat serviciul. Detalii în jurnalul de acțiuni."}
        {role === "family" && caseData.status === "FUNERAL_COMPLETED" && " Înmormântarea s-a finalizat. Puteți deschide succesiunea la notar."}
        {role === "family" && caseData.status === "SUCCESSION_OPEN" && " Notarul instrumentează dosarul de succesiune."}
        {role === "family" && caseData.status === "SUCCESSION_CLOSED" && " Procedura succesorală este finalizată."}
      </p>
    </div>
  );
}

function FuneralPanel({ caseData, onScheduled, onCompleted }: { caseData: any; onScheduled: () => void; onCompleted: () => void }) {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const schedM = useMutation({
    mutationFn: scheduleFuneral,
    onSuccess: () => { toast.success("Înmormântare programată."); onScheduled(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const doneM = useMutation({
    mutationFn: completeFuneral,
    onSuccess: () => { toast.success("Înmormântare marcată ca finalizată."); onCompleted(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });

  if (caseData.status === "FUNERAL_SCHEDULED") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-lg font-semibold">Înmormântare programată</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Detalii: {caseData.funeral?.date && new Date(caseData.funeral.date).toLocaleString("ro-RO")} — {caseData.funeral?.location}
        </p>
        <Button onClick={() => doneM.mutate({ case_id: caseData.id })} disabled={doneM.isPending} className="bg-brand-navy hover:bg-brand-navy/90">
          {doneM.isPending ? "Se procesează..." : "Marchează finalizată"}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); schedM.mutate({ case_id: caseData.id, date, location }); }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 className="mb-2 font-display text-lg font-semibold">Programare servicii funerare</h2>
      <p className="mb-6 text-sm text-muted-foreground">Stabiliți data și locația ceremoniei. Familia va fi notificată.</p>
      <div className="space-y-4">
        <div><Label htmlFor="f-date">Dată și oră</Label><Input id="f-date" type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><Label htmlFor="f-loc">Locație</Label><Input id="f-loc" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Cimitirul Bellu, Capela 3" /></div>
      </div>
      <Button type="submit" disabled={schedM.isPending} className="mt-6 bg-brand-navy hover:bg-brand-navy/90">
        {schedM.isPending ? "Se programează..." : "Confirmă programarea"}
      </Button>
    </form>
  );
}

function NotaryPanel({ caseData, onChanged }: { caseData: any; onChanged: () => void }) {
  const [heirs, setHeirs] = useState("");
  const openM = useMutation({
    mutationFn: openSuccession,
    onSuccess: () => { toast.success("Succesiune deschisă."); onChanged(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const closeM = useMutation({
    mutationFn: closeSuccession,
    onSuccess: () => { toast.success("Certificat de moștenitor emis."); onChanged(); },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });

  if (caseData.status === "SUCCESSION_OPEN") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-lg font-semibold">Succesiune în curs</h2>
        <p className="mb-4 text-sm text-muted-foreground">Moștenitori declarați: {caseData.succession?.heirs}</p>
        <Button onClick={() => closeM.mutate({ case_id: caseData.id })} disabled={closeM.isPending} className="bg-brand-navy hover:bg-brand-navy/90">
          {closeM.isPending ? "Se procesează..." : "Emite certificat de moștenitor și închide"}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); openM.mutate({ case_id: caseData.id, heirs }); }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 className="mb-2 font-display text-lg font-semibold">Deschidere procedură succesorală</h2>
      <p className="mb-6 text-sm text-muted-foreground">Înregistrați moștenitorii declarați. Familia va fi notificată.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="n-heirs">Moștenitori (nume, calitate)</Label>
          <Textarea id="n-heirs" required value={heirs} onChange={(e) => setHeirs(e.target.value)} placeholder="Ex: Maria Ionescu — soție; Andrei Ionescu — fiu" />
        </div>
      </div>
      <Button type="submit" disabled={openM.isPending} className="mt-6 bg-brand-navy hover:bg-brand-navy/90">
        {openM.isPending ? "Se procesează..." : "Deschide succesiunea"}
      </Button>
    </form>
  );
}

function DoctorIssueForm({ onSubmit, busy }: { onSubmit: (d: { cause_main: string; cause_secondary?: string; icd10?: string }) => void; busy: boolean }) {
  const [main, setMain] = useState("");
  const [sec, setSec] = useState("");
  const [icd, setIcd] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ cause_main: main, cause_secondary: sec, icd10: icd }); }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Stethoscope className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold">Eliberare CMCD</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Completați cauza decesului. Documentul va fi semnat electronic (mock).
      </p>
      <div className="space-y-4">
        <div><Label htmlFor="cmcd-main">Cauza principală</Label><Input id="cmcd-main" required value={main} onChange={(e) => setMain(e.target.value)} placeholder="Ex: Insuficiență cardiacă cronică" /></div>
        <div><Label htmlFor="cmcd-sec">Cauza secundară (opțional)</Label><Input id="cmcd-sec" value={sec} onChange={(e) => setSec(e.target.value)} /></div>
        <div><Label htmlFor="cmcd-icd">Cod ICD-10 (opțional)</Label><Input id="cmcd-icd" value={icd} onChange={(e) => setIcd(e.target.value)} placeholder="Ex: I50.9" /></div>
      </div>
      <Button type="submit" disabled={busy} className="mt-6 bg-brand-navy hover:bg-brand-navy/90">
        {busy ? "Se semnează..." : "Semnează și emite CMCD"}
      </Button>
    </form>
  );
}

function CorrectionsDialog({ onSubmit }: { onSubmit: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Solicită corecții</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Solicitare corecții</DialogTitle></DialogHeader>
        <Textarea placeholder="Motivul..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button onClick={() => { onSubmit(reason); setOpen(false); }} disabled={reason.length < 3}>Trimite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentVault({ docs, caseId }: { docs: any[]; caseId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<"id_card" | "birth_certificate" | "marriage_certificate" | "other">("other");
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Selectați un fișier.");
    if (!title.trim()) return toast.error("Adăugați un titlu.");
    setUploading(true);
    try {
      await uploadDocument(caseId, file, docType, title.trim());
      toast.success("Document încărcat.");
      setOpen(false);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["case", caseId] });
    } catch (e: any) {
      toast.error(e.message ?? "Eroare la încărcare");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await getDocumentDownloadUrl({ document_id: id });
      window.open(res.url, "_blank");
    } catch (e: any) {
      toast.error(e?.detail ?? e.message ?? "Eroare la descărcare");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
        <h2 className="font-display text-sm font-semibold">Seiful cu documente</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{docs.length} documente</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Upload className="size-4" /> Încarcă
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Încarcă document</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tip document</Label>
                  <Select value={docType} onValueChange={(v) => setDocType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card">Carte de identitate</SelectItem>
                      <SelectItem value="birth_certificate">Certificat de naștere</SelectItem>
                      <SelectItem value="marriage_certificate">Certificat de căsătorie</SelectItem>
                      <SelectItem value="other">Alt document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Titlu</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: CI decedat" />
                </div>
                <div>
                  <Label>Fișier (PDF, JPG, PNG)</Label>
                  <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpload} disabled={uploading} className="bg-brand-navy hover:bg-brand-navy/90">
                  {uploading ? "Se încarcă..." : "Încarcă document"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="divide-y divide-border">
        {docs.length === 0 && <p className="p-6 text-sm text-muted-foreground">Niciun document încă.</p>}
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded bg-brand-navy/5">
                <FileText className="size-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-sm font-medium">{d.title || DOC_TYPE_LABELS[d.type]}</p>
                <p className="text-xs text-muted-foreground">
                  {DOC_TYPE_LABELS[d.type]} • {formatDateTimeRo(d.issued_at)}{d.signed && " • Semnat"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {d.signed && <Badge variant="outline" className="text-brand-sage">Validat</Badge>}
              {d.storage_path && (
                <Button size="sm" variant="ghost" aria-label={`Descarcă ${d.title || DOC_TYPE_LABELS[d.type]}`} onClick={() => handleDownload(d.id)} className="gap-1">
                  <Download className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
