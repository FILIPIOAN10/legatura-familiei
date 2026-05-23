import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getCase, issueCmcd, validateAndIssueDeathCert, requestCorrections, scheduleFuneral, completeFuneral } from "@/lib/cases.functions";
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
import { formatDateTimeRo } from "@/lib/format";
import { toast } from "sonner";
import { FileText, Stethoscope, Building2, Upload, Download, Phone, Star, MapPin, Check } from "lucide-react";
import { FUNERAL_PROVIDERS } from "@/lib/funeral-providers";


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
          Deces: {formatDateTimeRo(c.deceased_dod)} • {c.city ?? "—"}, {c.county ?? "—"}
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

function isClujNapoca(city?: string, county?: string) {
  const c = (city ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ");
  const j = (county ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return j.includes("cluj") && (c.includes("cluj napoca") || c.includes("cluj"));
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
          <h2 className="font-display text-lg font-semibold">Înregistrare în SIIEASC</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Verificați CMCD-ul și actele anexate (CI/BI decedat, certificat de naștere, certificat de căsătorie, CI declarant).
          La validare se înregistrează decesul în <strong>SIIEASC</strong> (Sistemul Informatic Integrat pentru Emiterea Actelor de Stare Civilă),
          se generează actul de deces și certificatul de deces, și, dacă e cazul, adeverința de înhumare.
        </p>
        <ul className="mb-6 space-y-1 text-xs text-muted-foreground">
          <li>✓ CMCD primit de la medic</li>
          <li>✓ Acte aparținător încărcate în seif</li>
          <li>→ Înregistrare în SIIEASC și emitere certificat</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => validateM.mutate({ case_id: caseData.id })}
            disabled={validateM.isPending}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {validateM.isPending ? "Se înregistrează în SIIEASC..." : "Înregistrează în SIIEASC și emite certificat"}
          </Button>
          <CorrectionsDialog onSubmit={(reason) => correctionsM.mutate({ case_id: caseData.id, reason })} />
        </div>
      </div>
    );
  }

  if (role === "family" && caseData.status === "DEATH_CERT_ISSUED" && isClujNapoca(caseData.city, caseData.county)) {
    return <FuneralProviderPicker certNumber={caseData.certificate_number} status={caseData.status} />;
  }

  if (role === "civil_officer" && caseData.status === "DEATH_CERT_ISSUED" && isClujNapoca(caseData.city, caseData.county)) {
    return <FuneralProviderPicker certNumber={caseData.certificate_number} status={caseData.status} />;
  }

  if (role === "family" && caseData.status === "DEATH_CERT_ISSUED") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-lg font-semibold">Alegeți o casă funerară</h2>
        <p className="text-sm text-muted-foreground">
          Certificatul de deces a fost emis. Contactați o casă funerară direct.
        </p>
      </div>
    );
  }

  if (role === "funeral_provider" && (caseData.status === "DEATH_CERT_ISSUED" || caseData.status === "FUNERAL_SCHEDULED")) {
    return <FuneralPanel caseData={caseData} onScheduled={invalidate} onCompleted={invalidate} />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-2 font-display text-lg font-semibold">Status curent</h2>
      <p className="text-sm text-muted-foreground">
        Cazul este în starea: <strong className="text-brand-navy">{CASE_STATUS_LABELS[caseData.status]}</strong>.
        {role === "family" && caseData.status === "AWAITING_DOCTOR" && " Medicul a fost notificat. Așteptăm emiterea CMCD."}
        {role === "family" && caseData.status === "CMCD_ISSUED" && " CMCD-ul a fost emis. Încărcați actele necesare (CI/BI decedat, certificat naștere, certificat căsătorie dacă e cazul, CI declarant) pentru a notifica funcționarul de stare civilă."}
        {role === "family" && caseData.status === "DEATH_CERT_ISSUED" && ` Certificatul de deces ${caseData.certificate_number ?? ""} este disponibil. Puteți contacta o casă funerară.`}
        {role === "family" && caseData.status === "FUNERAL_SCHEDULED" && " Casa funerară a programat serviciul. Detalii în jurnalul de acțiuni."}
        {role === "family" && caseData.status === "FUNERAL_COMPLETED" && " Înmormântarea s-a finalizat. Procesul este complet."}
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

function FuneralProviderPicker({ certNumber, status }: { certNumber?: string; status?: string }) {
  const providers = FUNERAL_PROVIDERS
    .filter((p) => p.city.toLowerCase().includes("cluj"))
    .sort((a, b) => a.priceFrom - b.priceFrom);
  const certIssued = status === "DEATH_CERT_ISSUED";

  return (
    <div className="rounded-xl border-2 border-brand-sage bg-brand-sage/5 p-6">
      <div className="mb-2 flex items-center gap-2">
        <Building2 className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold text-brand-navy">Case funerare recomandate în Cluj-Napoca</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {certIssued
          ? <>Certificatul de deces {certNumber ? <span className="font-mono">{certNumber}</span> : ""} a fost emis. Mai jos găsiți {providers.length} case funerare din Cluj-Napoca, sortate crescător după preț.</>
          : <>Mai jos găsiți {providers.length} case funerare din Cluj-Napoca, sortate crescător după preț. Puteți contacta oricând o casă funerară pentru informații.</>}
      </p>
      {providers.length === 0 && (
        <p className="text-sm text-muted-foreground">Nu există case funerare listate pentru Cluj-Napoca.</p>
      )}
      {providers.length > 0 && (
        <ul className="space-y-3">
          {providers.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {i === 0 && <Badge className="bg-brand-sage text-white">Cel mai accesibil</Badge>}
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <MapPin className="size-3" /> {p.city}
                  {" • "}
                  <Star className="inline size-3 -mt-0.5 fill-current text-amber-500" />
                  {" "}{p.rating.toFixed(1)}
                  {" • "}{p.notes}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">de la</p>
                  <p className="font-display text-base font-semibold text-brand-navy">
                    {p.priceFrom.toLocaleString("ro-RO")} RON
                  </p>
                </div>
                <Button asChild size="sm" className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
                  <a href={`tel:${p.phone.replace(/\s+/g, "")}`} aria-label={`Sună ${p.name}`}>
                    <Phone className="size-4" /> {p.phone}
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-brand-navy text-brand-navy hover:bg-brand-navy/5"
                  onClick={() => toast.success(`Ați ales ${p.name}. Casa funerară va fi notificată.`)}
                  aria-label={`Alege ${p.name}`}
                >
                  <Check className="size-4" /> Alege
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Prețurile sunt orientative, pentru pachetul de bază. Confirmați costurile direct cu casa funerară.
      </p>
    </div>
  );
}

function DocumentVault({ docs, caseId }: { docs: any[]; caseId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<string>("id_card_deceased");
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
                  <Select value={docType} onValueChange={(v) => setDocType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card_deceased">CI/BI decedat</SelectItem>
                      <SelectItem value="birth_certificate">Certificat de naștere decedat</SelectItem>
                      <SelectItem value="marriage_certificate">Certificat de căsătorie</SelectItem>
                      <SelectItem value="id_card_declarant">CI declarant</SelectItem>
                      <SelectItem value="other">Alt document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Titlu</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: CI decedat" />
                </div>
                <div>
                  <Label>Fișier (doar PDF)</Label>
                  <Input ref={fileRef} type="file" accept="application/pdf,.pdf" />
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
