import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  getCase,
  issueCmcd,
  validateAndIssueDeathCert,
  requestCorrections,
  scheduleFuneral,
  completeFuneral,
} from "@/lib/cases.functions";
import {
  uploadDocument,
  getDocumentDownloadUrl,
  validateDocument,
  requestDocumentClarification,
} from "@/lib/documents.functions";
import { CaseStepper } from "@/components/case-stepper";
import { DeadlineCard } from "@/components/deadline-card";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { CASE_STATUS_LABELS, DOC_TYPE_LABELS } from "@/lib/legal";
import { formatDateTimeRo } from "@/lib/format";
import { toast } from "sonner";
import {
  FileText,
  Stethoscope,
  Building2,
  Upload,
  Download,
  Phone,
  Star,
  MapPin,
  Check,
  AlertTriangle,
  MessageSquareWarning,
} from "lucide-react";
import { FUNERAL_PROVIDERS } from "@/lib/funeral-providers";

const REQUIRED_FAMILY_DOC_TYPES = [
  "id_card_deceased",
  "birth_certificate",
  "id_card_declarant",
] as const;
const OPTIONAL_FAMILY_DOC_TYPES = ["marriage_certificate"] as const;

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
          <span className="text-sm text-muted-foreground">
            Dosar: <span className="font-mono">{c.case_number}</span>
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">{c.deceased_full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deces: {formatDateTimeRo(c.deceased_dod)} • {c.city ?? "—"}, {c.county ?? "—"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CaseStepper current={c.status} />

          <ActionPanel caseData={c} documents={data.documents} />

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
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${t.status === "done" ? "bg-brand-sage" : "bg-muted-foreground/40"}`}
                  />
                  <div>
                    <p className="font-medium">{t.title}</p>
                    {t.legal_reference && (
                      <p className="text-[11px] text-muted-foreground">{t.legal_reference}</p>
                    )}
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
                  <span className="font-medium text-foreground">{a.action}</span> —{" "}
                  {formatDateTimeRo(a.created_at)}
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
  const c = (city ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ");
  const j = (county ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return j.includes("cluj") && (c.includes("cluj napoca") || c.includes("cluj"));
}

function ActionPanel({ caseData, documents }: { caseData: any; documents: any[] }) {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["case", caseData.id] });

  const issueM = useMutation({
    mutationFn: issueCmcd,
    onSuccess: () => {
      toast.success("CMCD emis și transmis la Starea Civilă.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const validateM = useMutation({
    mutationFn: validateAndIssueDeathCert,
    onSuccess: (r: any) => {
      toast.success(`Certificat ${r.certificate_number} emis.`);
      invalidate();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const correctionsM = useMutation({
    mutationFn: requestCorrections,
    onSuccess: () => {
      toast.success("Solicitare trimisă.");
      invalidate();
    },
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

  if (
    role === "civil_officer" &&
    (caseData.status === "CMCD_ISSUED" || caseData.status === "AWAITING_CIVIL_OFFICER")
  ) {
    return (
      <CivilOfficerReviewPanel
        caseData={caseData}
        documents={documents}
        issuing={validateM.isPending}
        onIssueCert={() => validateM.mutate({ case_id: caseData.id })}
        onRequestCorrections={(reason) => correctionsM.mutate({ case_id: caseData.id, reason })}
      />
    );
  }

  if (
    role === "family" &&
    caseData.status === "DEATH_CERT_ISSUED" &&
    isClujNapoca(caseData.city, caseData.county)
  ) {
    return (
      <FuneralProviderPicker certNumber={caseData.certificate_number} status={caseData.status} />
    );
  }

  if (
    role === "civil_officer" &&
    caseData.status === "DEATH_CERT_ISSUED" &&
    isClujNapoca(caseData.city, caseData.county)
  ) {
    return (
      <FuneralProviderPicker certNumber={caseData.certificate_number} status={caseData.status} />
    );
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

  if (
    role === "funeral_provider" &&
    (caseData.status === "DEATH_CERT_ISSUED" || caseData.status === "FUNERAL_SCHEDULED")
  ) {
    return <FuneralPanel caseData={caseData} onScheduled={invalidate} onCompleted={invalidate} />;
  }

  if (role === "family" && caseData.status === "CMCD_ISSUED") {
    return <FamilyDocumentsChecklist caseId={caseData.id} documents={documents} />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-2 font-display text-lg font-semibold">Status curent</h2>
      <p className="text-sm text-muted-foreground">
        Cazul este în starea:{" "}
        <strong className="text-brand-navy">{CASE_STATUS_LABELS[caseData.status]}</strong>.
        {role === "family" &&
          caseData.status === "AWAITING_DOCTOR" &&
          " Medicul a fost notificat. Așteptăm emiterea CMCD."}
        {role === "family" &&
          caseData.status === "DEATH_CERT_ISSUED" &&
          ` Certificatul de deces ${caseData.certificate_number ?? ""} este disponibil. Puteți contacta o casă funerară.`}
        {role === "family" &&
          caseData.status === "FUNERAL_SCHEDULED" &&
          " Casa funerară a programat serviciul. Detalii în jurnalul de acțiuni."}
        {role === "family" &&
          caseData.status === "FUNERAL_COMPLETED" &&
          " Înmormântarea s-a finalizat. Procesul este complet."}
      </p>
    </div>
  );
}

function FuneralPanel({
  caseData,
  onScheduled,
  onCompleted,
}: {
  caseData: any;
  onScheduled: () => void;
  onCompleted: () => void;
}) {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const schedM = useMutation({
    mutationFn: scheduleFuneral,
    onSuccess: () => {
      toast.success("Înmormântare programată.");
      onScheduled();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const doneM = useMutation({
    mutationFn: completeFuneral,
    onSuccess: () => {
      toast.success("Înmormântare marcată ca finalizată.");
      onCompleted();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });

  if (caseData.status === "FUNERAL_SCHEDULED") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-lg font-semibold">Înmormântare programată</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Detalii:{" "}
          {caseData.funeral?.date && new Date(caseData.funeral.date).toLocaleString("ro-RO")} —{" "}
          {caseData.funeral?.location}
        </p>
        <Button
          onClick={() => doneM.mutate({ case_id: caseData.id })}
          disabled={doneM.isPending}
          className="bg-brand-navy hover:bg-brand-navy/90"
        >
          {doneM.isPending ? "Se procesează..." : "Marchează finalizată"}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        schedM.mutate({ case_id: caseData.id, date, location });
      }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h2 className="mb-2 font-display text-lg font-semibold">Programare servicii funerare</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Stabiliți data și locația ceremoniei. Familia va fi notificată.
      </p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="f-date">Dată și oră</Label>
          <Input
            id="f-date"
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="f-loc">Locație</Label>
          <Input
            id="f-loc"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Cimitirul Bellu, Capela 3"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={schedM.isPending}
        className="mt-6 bg-brand-navy hover:bg-brand-navy/90"
      >
        {schedM.isPending ? "Se programează..." : "Confirmă programarea"}
      </Button>
    </form>
  );
}

function FamilyDocumentsChecklist({ caseId, documents }: { caseId: string; documents: any[] }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const hasType = (type: string) => documents.some((d) => d.type === type);

  const docNeedingClarification = documents.find((d) => d.validation_note && !d.validated);

  const startUpload = (type: string) => {
    setActiveType(type);
    setTimeout(() => fileRef.current?.click(), 50);
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = activeType;
    e.target.value = "";
    if (!file || !type) return;
    setUploading(true);
    try {
      await uploadDocument(caseId, file, type, DOC_TYPE_LABELS[type] ?? "Document");
      toast.success(`Încărcat: ${DOC_TYPE_LABELS[type]}`);
      qc.invalidateQueries({ queryKey: ["case", caseId] });
    } catch (err: any) {
      toast.error(err?.message ?? "Eroare la încărcare");
    } finally {
      setUploading(false);
      setActiveType(null);
    }
  };

  const requiredMissing = REQUIRED_FAMILY_DOC_TYPES.filter((t) => !hasType(t));
  const allRequiredUploaded = requiredMissing.length === 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf,image/*"
        className="hidden"
        onChange={onFileChosen}
      />

      <div className="mb-3 flex items-center gap-2">
        <FileText className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold">Acte necesare pentru Starea Civilă</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        CMCD-ul a fost emis de medic. Încărcați pe rând actele necesare. Pe măsură ce sunt
        încărcate, dispar din lista de mai jos. După ce le-ați adăugat pe toate, funcționarul de
        Stare Civilă le va verifica.
      </p>

      {docNeedingClarification && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">
              Funcționarul cere lămuriri pentru:{" "}
              {docNeedingClarification.title || DOC_TYPE_LABELS[docNeedingClarification.type]}
            </p>
            <p className="mt-1 text-amber-800">{docNeedingClarification.validation_note}</p>
            <p className="mt-2 text-xs text-amber-700">
              Re-încărcați documentul corespunzător cu varianta corectată.
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {[...REQUIRED_FAMILY_DOC_TYPES, ...OPTIONAL_FAMILY_DOC_TYPES].map((t) => {
          const uploaded = hasType(t);
          const required = (REQUIRED_FAMILY_DOC_TYPES as readonly string[]).includes(t);
          return (
            <li
              key={t}
              className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                uploaded ? "border-brand-sage/30 bg-brand-sage/5" : "border-border bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full border ${
                    uploaded
                      ? "border-brand-sage bg-brand-sage text-white"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                  aria-hidden
                >
                  {uploaded ? <Check className="size-3.5" /> : <FileText className="size-3.5" />}
                </span>
                <div>
                  <p
                    className={
                      uploaded
                        ? "font-medium text-foreground line-through decoration-brand-sage/70"
                        : "font-medium text-foreground"
                    }
                  >
                    {DOC_TYPE_LABELS[t]}
                  </p>
                  {!required && (
                    <p className="text-[11px] text-muted-foreground">opțional, dacă e cazul</p>
                  )}
                </div>
              </div>
              {uploaded ? (
                <Badge variant="outline" className="border-brand-sage text-brand-sage">
                  Încărcat
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => startUpload(t)}
                >
                  <Upload className="size-4" />
                  Încarcă
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs text-muted-foreground">
        {allRequiredUploaded ? (
          <>
            ✓ Toate actele obligatorii sunt încărcate. Funcționarul de Stare Civilă poate verifica
            și valida dosarul.
          </>
        ) : (
          <>
            Mai aveți {requiredMissing.length} act
            {requiredMissing.length === 1 ? "" : "e"} obligatori
            {requiredMissing.length === 1 ? "u" : "i"} de încărcat.
          </>
        )}
      </p>
    </div>
  );
}

function CivilOfficerReviewPanel({
  caseData,
  documents,
  issuing,
  onIssueCert,
  onRequestCorrections,
}: {
  caseData: any;
  documents: any[];
  issuing: boolean;
  onIssueCert: () => void;
  onRequestCorrections: (reason: string) => void;
}) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["case", caseData.id] });

  const validateM = useMutation({
    mutationFn: (id: string) => validateDocument(id),
    onSuccess: () => {
      toast.success("Document validat.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });
  const clarifyM = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      requestDocumentClarification(id, note),
    onSuccess: () => {
      toast.success("Lămuriri solicitate aparținătorului.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message),
  });

  const validatableDocs = documents;
  const validatedCount = validatableDocs.filter((d) => d.validated).length;
  const totalCount = validatableDocs.length;
  const hasCmcd = validatableDocs.some((d) => d.type === "cmcd");
  const allValidated = totalCount > 0 && validatedCount === totalCount && hasCmcd;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold">Verificare documente — Stare Civilă</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Descărcați fiecare document din Seif, verificați-l, apoi marcați
        <strong> „Validat OK" </strong> sau <strong>„Cere lămuriri"</strong> aparținătorului.
        Butonul de emitere a certificatului se activează după ce toate documentele (inclusiv
        CMCD-ul) sunt validate.
      </p>

      {totalCount === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Niciun document în seif încă.
        </p>
      ) : (
        <ul className="mb-5 space-y-2">
          {validatableDocs.map((d) => (
            <CivilOfficerDocRow
              key={d.id}
              doc={d}
              validating={validateM.isPending && validateM.variables === d.id}
              onValidate={() => validateM.mutate(d.id)}
              onRequestClarification={(note) => clarifyM.mutate({ id: d.id, note })}
              clarifying={clarifyM.isPending && (clarifyM.variables as any)?.id === d.id}
            />
          ))}
        </ul>
      )}

      <div className="mb-5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
        <span className="font-medium text-foreground">
          {validatedCount} / {totalCount}
        </span>{" "}
        <span className="text-muted-foreground">documente validate</span>
        {!hasCmcd && <span className="ml-2 text-xs text-amber-700">(lipsă CMCD)</span>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onIssueCert}
          disabled={!allValidated || issuing}
          className="bg-brand-navy hover:bg-brand-navy/90"
        >
          {issuing
            ? "Se înregistrează în SIIEASC..."
            : "Înregistrează în SIIEASC și emite certificat"}
        </Button>
        <CorrectionsDialog onSubmit={onRequestCorrections} />
      </div>
      {!allValidated && totalCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Validați toate documentele de mai sus pentru a putea emite certificatul.
        </p>
      )}
    </div>
  );
}

function CivilOfficerDocRow({
  doc,
  validating,
  onValidate,
  onRequestClarification,
  clarifying,
}: {
  doc: any;
  validating: boolean;
  onValidate: () => void;
  onRequestClarification: (note: string) => void;
  clarifying: boolean;
}) {
  const handleDownload = async () => {
    try {
      const res = await getDocumentDownloadUrl({ document_id: doc.id });
      window.open(res.url, "_blank");
    } catch (e: any) {
      toast.error(e?.detail ?? e.message ?? "Eroare la descărcare");
    }
  };
  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
        doc.validated
          ? "border-brand-sage/40 bg-brand-sage/5"
          : doc.validation_note
            ? "border-amber-300 bg-amber-50/50"
            : "border-border bg-background"
      }`}
    >
      <div className="min-w-0 flex items-start gap-3">
        <FileText className="mt-0.5 size-4 shrink-0 text-brand-navy" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {doc.title || DOC_TYPE_LABELS[doc.type] || doc.type}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {DOC_TYPE_LABELS[doc.type] ?? doc.type}
            {doc.signed && " • semnat de emitent"}
          </p>
          {doc.validation_note && (
            <p className="mt-1 text-xs text-amber-800">
              Lămuriri cerute: <em>„{doc.validation_note}"</em>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {doc.validated && (
          <Badge className="bg-brand-sage text-white">
            <Check className="mr-1 size-3" /> Validat
          </Badge>
        )}
        {doc.storage_path && (
          <Button size="sm" variant="outline" className="gap-1" onClick={handleDownload}>
            <Download className="size-4" /> Descarcă
          </Button>
        )}
        {!doc.validated && (
          <>
            <Button
              size="sm"
              className="gap-1 bg-brand-sage text-white hover:bg-brand-sage/90"
              disabled={validating}
              onClick={onValidate}
            >
              <Check className="size-4" /> {validating ? "..." : "Validează OK"}
            </Button>
            <ClarifyDialog busy={clarifying} onSubmit={onRequestClarification} />
          </>
        )}
      </div>
    </li>
  );
}

function ClarifyDialog({ onSubmit, busy }: { onSubmit: (note: string) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 border-amber-400 text-amber-800 hover:bg-amber-50"
        >
          <AlertTriangle className="size-4" /> Cere lămuriri
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cere lămuriri aparținătorului</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Aparținătorul va primi o notificare cu mesajul de mai jos și va putea reîncărca
          documentul.
        </p>
        <Textarea
          placeholder="Ex: documentul este ilizibil, vă rog reîncărcați o copie color..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onSubmit(note);
              setOpen(false);
              setNote("");
            }}
            disabled={note.trim().length < 3 || busy}
          >
            {busy ? "Se trimite..." : "Trimite cererea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DoctorIssueForm({
  onSubmit,
  busy,
}: {
  onSubmit: (d: { cause_main: string; cause_secondary?: string; icd10?: string }) => void;
  busy: boolean;
}) {
  const [main, setMain] = useState("");
  const [sec, setSec] = useState("");
  const [icd, setIcd] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ cause_main: main, cause_secondary: sec, icd10: icd });
      }}
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
        <div>
          <Label htmlFor="cmcd-main">Cauza principală</Label>
          <Input
            id="cmcd-main"
            required
            value={main}
            onChange={(e) => setMain(e.target.value)}
            placeholder="Ex: Insuficiență cardiacă cronică"
          />
        </div>
        <div>
          <Label htmlFor="cmcd-sec">Cauza secundară (opțional)</Label>
          <Input id="cmcd-sec" value={sec} onChange={(e) => setSec(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cmcd-icd">Cod ICD-10 (opțional)</Label>
          <Input
            id="cmcd-icd"
            value={icd}
            onChange={(e) => setIcd(e.target.value)}
            placeholder="Ex: I50.9"
          />
        </div>
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
      <DialogTrigger asChild>
        <Button variant="outline">Solicită corecții</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitare corecții</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Motivul..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onSubmit(reason);
              setOpen(false);
            }}
            disabled={reason.length < 3}
          >
            Trimite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FuneralProviderPicker({ certNumber, status }: { certNumber?: string; status?: string }) {
  const providers = FUNERAL_PROVIDERS.filter((p) => p.city.toLowerCase().includes("cluj")).sort(
    (a, b) => a.priceFrom - b.priceFrom,
  );
  const certIssued = status === "DEATH_CERT_ISSUED";

  return (
    <div className="rounded-xl border-2 border-brand-sage bg-brand-sage/5 p-6">
      <div className="mb-2 flex items-center gap-2">
        <Building2 className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold text-brand-navy">
          Case funerare recomandate în Cluj-Napoca
        </h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {certIssued ? (
          <>
            Certificatul de deces{" "}
            {certNumber ? <span className="font-mono">{certNumber}</span> : ""} a fost emis. Mai jos
            găsiți {providers.length} case funerare din Cluj-Napoca, sortate crescător după preț.
          </>
        ) : (
          <>
            Mai jos găsiți {providers.length} case funerare din Cluj-Napoca, sortate crescător după
            preț. Puteți contacta oricând o casă funerară pentru informații.
          </>
        )}
      </p>
      {providers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nu există case funerare listate pentru Cluj-Napoca.
        </p>
      )}
      {providers.length > 0 && (
        <ul className="space-y-3">
          {providers.map((p, i) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {i === 0 && <Badge className="bg-brand-sage text-white">Cel mai accesibil</Badge>}
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <MapPin className="size-3" /> {p.city}
                  {" • "}
                  <Star className="inline size-3 -mt-0.5 fill-current text-amber-500" />{" "}
                  {p.rating.toFixed(1)}
                  {" • "}
                  {p.notes}
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
                  className="border-brand-navy text-brand-navy hover:bg-brand-navy/5"
                  onClick={() =>
                    toast.success("Ați ales " + p.name + ". Casa funerară va fi notificată.")
                  }
                  aria-label={"Alege " + p.name}
                >
                  Alege
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Prețurile sunt orientative, pentru pachetul de bază. Confirmați costurile direct cu casa
        funerară.
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
              <DialogHeader>
                <DialogTitle>Încarcă document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tip document</Label>
                  <Select value={docType} onValueChange={(v) => setDocType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card_deceased">CI/BI decedat</SelectItem>
                      <SelectItem value="birth_certificate">
                        Certificat de naștere decedat
                      </SelectItem>
                      <SelectItem value="marriage_certificate">Certificat de căsătorie</SelectItem>
                      <SelectItem value="id_card_declarant">CI declarant</SelectItem>
                      <SelectItem value="other">Alt document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Titlu</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: CI decedat"
                  />
                </div>
                <div>
                  <Label>Fișier (doar PDF)</Label>
                  <Input ref={fileRef} type="file" accept="application/pdf,.pdf" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-brand-navy hover:bg-brand-navy/90"
                >
                  {uploading ? "Se încarcă..." : "Încarcă document"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="divide-y divide-border">
        {docs.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Niciun document încă.</p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded bg-brand-navy/5">
                <FileText className="size-5 text-brand-navy" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.title || DOC_TYPE_LABELS[d.type]}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {DOC_TYPE_LABELS[d.type]} • {formatDateTimeRo(d.issued_at)}
                  {d.signed && " • Semnat"}
                </p>
                {d.validation_note && !d.validated && (
                  <p className="mt-1 text-xs text-amber-800">
                    <MessageSquareWarning className="mr-1 inline size-3" />
                    Lămuriri cerute: <em>„{d.validation_note}"</em>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              {d.validated && (
                <Badge className="bg-brand-sage text-white">
                  <Check className="mr-1 size-3" /> Validat
                </Badge>
              )}
              {!d.validated && d.validation_note && (
                <Badge variant="outline" className="border-amber-400 text-amber-800">
                  Lămuriri cerute
                </Badge>
              )}
              {d.storage_path && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Descarcă ${d.title || DOC_TYPE_LABELS[d.type]}`}
                  onClick={() => handleDownload(d.id)}
                  className="gap-1"
                >
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
