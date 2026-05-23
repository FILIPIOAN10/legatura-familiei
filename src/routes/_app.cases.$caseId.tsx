import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { getCase, issueCmcd, validateAndIssueDeathCert, requestCorrections } from "@/lib/cases.functions";
import { registerUploadedDocument, getDocumentDownloadUrl } from "@/lib/documents.functions";
import { supabase } from "@/integrations/supabase/client";
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
  const fn = useServerFn(getCase);
  const { data, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => fn({ data: { id: caseId } }),
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

          <ActionPanel caseData={c} onChanged={() => {}} />

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

function ActionPanel({ caseData, onChanged }: { caseData: any; onChanged: () => void }) {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["case", caseData.id] });

  const issueCmcdFn = useServerFn(issueCmcd);
  const validateFn = useServerFn(validateAndIssueDeathCert);
  const correctionsFn = useServerFn(requestCorrections);

  const issueM = useMutation({
    mutationFn: issueCmcdFn,
    onSuccess: () => { toast.success("CMCD emis și transmis la Starea Civilă."); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const validateM = useMutation({
    mutationFn: validateFn,
    onSuccess: (r: any) => { toast.success(`Certificat ${r.certificate_number} emis.`); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const correctionsM = useMutation({
    mutationFn: correctionsFn,
    onSuccess: () => { toast.success("Solicitare trimisă."); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  // DOCTOR action
  if (role === "doctor" && caseData.status === "AWAITING_DOCTOR") {
    return <DoctorIssueForm onSubmit={(d) => issueM.mutate({ data: { case_id: caseData.id, ...d } })} busy={issueM.isPending} />;
  }

  // CIVIL OFFICER action
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
          <Button onClick={() => validateM.mutate({ data: { case_id: caseData.id } })} disabled={validateM.isPending} className="bg-brand-navy hover:bg-brand-navy/90">
            {validateM.isPending ? "Se procesează..." : "Aprobă și emite certificat de deces"}
          </Button>
          <CorrectionsDialog onSubmit={(reason) => correctionsM.mutate({ data: { case_id: caseData.id, reason } })} />
        </div>
      </div>
    );
  }

  // FAMILY status
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-2 font-display text-lg font-semibold">Status curent</h2>
      <p className="text-sm text-muted-foreground">
        Cazul este în starea: <strong className="text-brand-navy">{CASE_STATUS_LABELS[caseData.status]}</strong>.
        {role === "family" && caseData.status === "AWAITING_DOCTOR" && " Medicul a fost notificat. Așteptăm emiterea CMCD."}
        {role === "family" && caseData.status === "CMCD_ISSUED" && " CMCD-ul a fost emis. Funcționarul de stare civilă urmează să valideze și să emită certificatul de deces."}
        {role === "family" && caseData.status === "DEATH_CERT_ISSUED" && " Certificatul de deces este disponibil în secțiunea Documente."}
      </p>
    </div>
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
        <div><Label>Cauza principală</Label><Input required value={main} onChange={(e) => setMain(e.target.value)} placeholder="Ex: Insuficiență cardiacă cronică" /></div>
        <div><Label>Cauza secundară (opțional)</Label><Input value={sec} onChange={(e) => setSec(e.target.value)} /></div>
        <div><Label>Cod ICD-10 (opțional)</Label><Input value={icd} onChange={(e) => setIcd(e.target.value)} placeholder="Ex: I50.9" /></div>
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

function DocumentVault({ docs }: { docs: any[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
        <h2 className="font-display text-sm font-semibold">Seiful cu documente</h2>
        <span className="text-xs text-muted-foreground">{docs.length} documente</span>
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
            {d.signed && <Badge variant="outline" className="text-brand-sage">Validat</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}
