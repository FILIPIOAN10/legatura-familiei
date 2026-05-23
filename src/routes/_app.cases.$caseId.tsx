import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useMemo } from "react";
import {
  getCase,
  issueCmcd,
  validateAndIssueDeathCert,
  requestCorrections,
  scheduleFuneral,
  completeFuneral,
  submitFamilyDocuments,
  selectFuneralProvider,
} from "@/lib/cases.functions";
import { uploadDocument, getDocumentDownloadUrl } from "@/lib/documents.functions";
import { CaseStepper } from "@/components/case-stepper";
import { DeadlineCard } from "@/components/deadline-card";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckCircle2,
  Circle,
  Search,
  Hourglass,
  Lock,
  Send,
} from "lucide-react";
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

  // Family uploads supporting documents and confirms before notifying the civil officer.
  if (role === "family" && caseData.status === "CMCD_ISSUED") {
    return (
      <FamilyDocumentsChecklist
        caseData={caseData}
        documents={documents}
        onSubmitted={invalidate}
      />
    );
  }

  // Civil officer is waiting until the family confirms the documents.
  if (role === "civil_officer" && caseData.status === "CMCD_ISSUED") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <Hourglass className="size-5 text-brand-navy" />
          <h2 className="font-display text-lg font-semibold">Așteptăm acte de la aparținător</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          CMCD-ul a fost emis. Aparținătorul încarcă în seif actele necesare (CI/BI decedat,
          certificat de naștere, certificat de căsătorie dacă e cazul, CI declarant). Veți fi
          notificat automat când acestea sunt confirmate.
        </p>
      </div>
    );
  }

  if (role === "civil_officer" && caseData.status === "AWAITING_CIVIL_OFFICER") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="size-5 text-brand-navy" />
          <h2 className="font-display text-lg font-semibold">Înregistrare în SIIEASC</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Verificați CMCD-ul și actele anexate (CI/BI decedat, certificat de naștere, certificat de
          căsătorie, CI declarant). La validare se înregistrează decesul în <strong>SIIEASC</strong>{" "}
          (Sistemul Informatic Integrat pentru Emiterea Actelor de Stare Civilă), se generează actul
          de deces și certificatul de deces, și, dacă e cazul, adeverința de înhumare.
        </p>
        <ul className="mb-6 space-y-1 text-xs text-muted-foreground">
          <li>✓ CMCD primit de la medic</li>
          <li>✓ Acte aparținător încărcate și confirmate</li>
          <li>→ Înregistrare în SIIEASC și emitere certificat</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => validateM.mutate({ case_id: caseData.id })}
            disabled={validateM.isPending}
            className="bg-brand-navy hover:bg-brand-navy/90"
          >
            {validateM.isPending
              ? "Se înregistrează în SIIEASC..."
              : "Înregistrează în SIIEASC și emite certificat"}
          </Button>
          <CorrectionsDialog
            onSubmit={(reason) => correctionsM.mutate({ case_id: caseData.id, reason })}
          />
        </div>
      </div>
    );
  }

  // Family flow after the civil officer issued the death certificate:
  // 1. notification card with explicit "search funeral provider" CTA,
  // 2. provider list with single selection that locks the others,
  // 3. confirm submission via API.
  if (role === "family" && caseData.status === "DEATH_CERT_ISSUED") {
    return <FamilyFuneralPickerFlow caseData={caseData} onConfirmed={invalidate} />;
  }

  if (
    role === "civil_officer" &&
    caseData.status === "DEATH_CERT_ISSUED" &&
    isClujNapoca(caseData.city, caseData.county)
  ) {
    return <FuneralProviderReadOnlyCard caseData={caseData} />;
  }

  if (
    role === "funeral_provider" &&
    (caseData.status === "DEATH_CERT_ISSUED" || caseData.status === "FUNERAL_SCHEDULED")
  ) {
    return <FuneralPanel caseData={caseData} onScheduled={invalidate} onCompleted={invalidate} />;
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
          caseData.status === "AWAITING_CIVIL_OFFICER" &&
          " Funcționarul de stare civilă a fost notificat și va emite certificatul de deces."}
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

// ===================== Family: documents checklist =====================

const REQUIRED_DOC_TYPES = [
  { type: "id_card_deceased", label: "CI/BI decedat", required: true },
  { type: "birth_certificate", label: "Certificat de naștere decedat", required: true },
  { type: "id_card_declarant", label: "CI declarant", required: true },
] as const;

function FamilyDocumentsChecklist({
  caseData,
  documents,
  onSubmitted,
}: {
  caseData: any;
  documents: any[];
  onSubmitted: () => void;
}) {
  const [marriageApplicable, setMarriageApplicable] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const uploadedTypes = useMemo(
    () => new Set<string>((documents ?? []).map((d) => d.type)),
    [documents],
  );

  const requiredOk = REQUIRED_DOC_TYPES.every((d) => uploadedTypes.has(d.type));
  const marriageOk = !marriageApplicable || uploadedTypes.has("marriage_certificate");
  const allReady = requiredOk && marriageOk;

  const submitM = useMutation({
    mutationFn: submitFamilyDocuments,
    onSuccess: () => {
      toast.success("Acte trimise. Funcționarul de stare civilă a fost notificat.");
      onSubmitted();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message ?? "Eroare la trimitere"),
  });

  const openUpload = (type: string) => {
    setPendingType(type);
    setUploadOpen(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold">Încărcare acte aparținător</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        CMCD-ul a fost emis de medic. Încărcați actele necesare; bifa apare automat când documentul
        este în seif. După ce toate actele obligatorii sunt încărcate, confirmați pentru a notifica
        funcționarul de stare civilă.
      </p>

      <ul className="mb-4 space-y-2">
        {REQUIRED_DOC_TYPES.map((d) => {
          const done = uploadedTypes.has(d.type);
          return (
            <li
              key={d.type}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition ${
                done ? "border-brand-sage/40 bg-brand-sage/5" : "border-border bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="size-5 text-brand-sage" aria-hidden />
                ) : (
                  <Circle className="size-5 text-muted-foreground" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {done ? "Document încărcat" : "Document obligatoriu — încă neîncărcat"}
                  </p>
                </div>
              </div>
              {!done && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openUpload(d.type)}
                  className="gap-2"
                >
                  <Upload className="size-4" /> Încarcă
                </Button>
              )}
            </li>
          );
        })}

        <li
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition ${
            uploadedTypes.has("marriage_certificate")
              ? "border-brand-sage/40 bg-brand-sage/5"
              : "border-border bg-background"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              <Checkbox
                id="marriage-applicable"
                checked={marriageApplicable}
                onCheckedChange={(v) => setMarriageApplicable(!!v)}
              />
            </div>
            <div>
              <Label htmlFor="marriage-applicable" className="text-sm font-medium">
                Decedatul era căsătorit (necesită certificat de căsătorie)
              </Label>
              <p className="text-xs text-muted-foreground">
                {uploadedTypes.has("marriage_certificate")
                  ? "Certificat de căsătorie încărcat"
                  : marriageApplicable
                    ? "Document obligatoriu — încă neîncărcat"
                    : "Nu este necesar dacă persoana decedată nu era căsătorită"}
              </p>
            </div>
          </div>
          {marriageApplicable && !uploadedTypes.has("marriage_certificate") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openUpload("marriage_certificate")}
              className="gap-2"
            >
              <Upload className="size-4" /> Încarcă
            </Button>
          )}
          {uploadedTypes.has("marriage_certificate") && (
            <CheckCircle2 className="size-5 text-brand-sage" aria-hidden />
          )}
        </li>
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={!allReady || submitM.isPending}
          onClick={() =>
            submitM.mutate({
              case_id: caseData.id,
              marriage_certificate_applicable: marriageApplicable,
            })
          }
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
        >
          <Send className="size-4" />
          {submitM.isPending
            ? "Se trimite..."
            : allReady
              ? "Confirmă și notifică Starea Civilă"
              : "Încărcați toate actele obligatorii"}
        </Button>
        {!allReady && (
          <p className="text-xs text-muted-foreground">
            Bifa pentru fiecare act apare în timp real după încărcarea în seif.
          </p>
        )}
      </div>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={(v) => {
          setUploadOpen(v);
          if (!v) setPendingType(null);
        }}
        caseId={caseData.id}
        forcedType={pendingType ?? undefined}
      />
    </div>
  );
}

// ===================== Family: funeral provider picker flow =====================

function FamilyFuneralPickerFlow({
  caseData,
  onConfirmed,
}: {
  caseData: any;
  onConfirmed: () => void;
}) {
  const [phase, setPhase] = useState<"notice" | "browsing">("notice");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectM = useMutation({
    mutationFn: selectFuneralProvider,
    onSuccess: (r: any) => {
      toast.success(`${r.provider_name} a fost notificată. Vă va contacta pentru programare.`);
      onConfirmed();
    },
    onError: (e: any) => toast.error(e?.detail ?? e.message ?? "Eroare la selecție"),
  });

  const providers = useMemo(() => {
    const inCluj = isClujNapoca(caseData.city, caseData.county);
    const list = inCluj
      ? FUNERAL_PROVIDERS.filter((p) => p.city.toLowerCase().includes("cluj"))
      : FUNERAL_PROVIDERS;
    return [...list].sort((a, b) => a.priceFrom - b.priceFrom);
  }, [caseData.city, caseData.county]);

  // Already chosen — show locked confirmation card.
  if (caseData.selected_provider) {
    return (
      <div className="rounded-xl border-2 border-brand-sage bg-brand-sage/5 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="size-5 text-brand-sage" />
          <h2 className="font-display text-lg font-semibold text-brand-navy">
            Casă funerară confirmată
          </h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Ați ales <strong className="text-foreground">{caseData.selected_provider.name}</strong>.
          {caseData.selected_provider.phone && (
            <>
              {" "}
              Telefon: <span className="font-mono">{caseData.selected_provider.phone}</span>.
            </>
          )}{" "}
          Casa funerară a fost notificată și vă va contacta pentru programare.
        </p>
        <Badge className="bg-brand-sage text-white">Pas finalizat</Badge>
      </div>
    );
  }

  // Phase 1 — explicit notification with a CTA. Do NOT auto-show the list.
  if (phase === "notice") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-brand-sage" />
          <h2 className="font-display text-lg font-semibold">Certificatul de deces a fost emis</h2>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          {caseData.certificate_number ? (
            <>
              Certificatul{" "}
              <span className="font-mono text-foreground">{caseData.certificate_number}</span> este
              disponibil în dosar.
            </>
          ) : (
            "Certificatul de deces este disponibil în dosar."
          )}
        </p>
        <p className="mb-5 text-sm text-muted-foreground">
          Următorul pas este alegerea unei case funerare. Când sunteți pregătit, căutați una dintre
          casele funerare partenere.
        </p>
        <Button
          onClick={() => setPhase("browsing")}
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
        >
          <Search className="size-4" /> Caută casă funerară
        </Button>
      </div>
    );
  }

  // Phase 2 — browse + select-with-lock.
  const isLocked = !!selectedId;

  return (
    <div className="rounded-xl border-2 border-brand-sage bg-brand-sage/5 p-6">
      <div className="mb-2 flex items-center gap-2">
        <Building2 className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold text-brand-navy">
          Case funerare{" "}
          {isClujNapoca(caseData.city, caseData.county) ? "în Cluj-Napoca" : "disponibile"}
        </h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Sunt {providers.length} case funerare, sortate crescător după preț. Selectați una pentru a o
        bloca; restul opțiunilor vor deveni inactive. Apoi confirmați pentru a o notifica.
      </p>

      <ul className="space-y-3">
        {providers.map((p, i) => {
          const selected = selectedId === p.id;
          const dim = isLocked && !selected;
          return (
            <li
              key={p.id}
              className={`flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between ${
                selected ? "border-brand-sage ring-2 ring-brand-sage" : "border-border"
              } ${dim ? "opacity-50" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {i === 0 && !isLocked && (
                    <Badge className="bg-brand-sage text-white">Cel mai accesibil</Badge>
                  )}
                  {selected && <Badge className="bg-brand-navy text-white">Selectat</Badge>}
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
                <Button asChild size="sm" variant="outline" disabled={dim}>
                  <a
                    href={`tel:${p.phone.replace(/\s+/g, "")}`}
                    aria-label={`Sună ${p.name}`}
                    className="gap-2"
                  >
                    <Phone className="size-4" /> {p.phone}
                  </a>
                </Button>
                <Button
                  size="sm"
                  className={
                    selected
                      ? "bg-brand-sage hover:bg-brand-sage/90 text-white"
                      : "bg-brand-navy hover:bg-brand-navy/90"
                  }
                  disabled={dim || selectM.isPending}
                  onClick={() => setSelectedId(selected ? null : p.id)}
                  aria-label={selected ? `Anulează selecția ${p.name}` : `Alege ${p.name}`}
                >
                  {selected ? "Selectat ✓" : "Alege"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button
          disabled={!selectedId || selectM.isPending}
          onClick={() => {
            if (!selectedId) return;
            const p = providers.find((x) => x.id === selectedId);
            if (!p) return;
            selectM.mutate({
              case_id: caseData.id,
              provider_id: p.id,
              provider_name: p.name,
              provider_phone: p.phone,
            });
          }}
          className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
        >
          <Send className="size-4" />
          {selectM.isPending ? "Se trimite..." : "Confirmă și trimite"}
        </Button>
        {selectedId && !selectM.isPending && (
          <Button variant="ghost" onClick={() => setSelectedId(null)}>
            Schimbă alegerea
          </Button>
        )}
        {!selectedId && (
          <p className="text-xs text-muted-foreground">
            Alegeți o casă funerară pentru a activa butonul de confirmare.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Prețurile sunt orientative, pentru pachetul de bază. Confirmați costurile direct cu casa
        funerară.
      </p>
    </div>
  );
}

function FuneralProviderReadOnlyCard({ caseData }: { caseData: any }) {
  if (!caseData.selected_provider) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-lg font-semibold">
          Așteptăm alegerea casei funerare
        </h2>
        <p className="text-sm text-muted-foreground">
          Aparținătorul a fost notificat că certificatul de deces a fost emis și urmează să aleagă o
          casă funerară.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-2 flex items-center gap-2">
        <Building2 className="size-5 text-brand-navy" />
        <h2 className="font-display text-lg font-semibold">Casă funerară aleasă</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Familia a ales{" "}
        <strong className="text-foreground">{caseData.selected_provider.name}</strong>
        {caseData.selected_provider.phone && (
          <>
            {" "}
            (tel: <span className="font-mono">{caseData.selected_provider.phone}</span>)
          </>
        )}
        .
      </p>
    </div>
  );
}

function DocumentVault({ docs, caseId }: { docs: any[]; caseId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

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
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
            <Upload className="size-4" /> Încarcă
          </Button>
          <UploadDocumentDialog open={open} onOpenChange={setOpen} caseId={caseId} />
        </div>
      </div>
      <div className="divide-y divide-border">
        {docs.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Niciun document încă.</p>
        )}
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded bg-brand-navy/5">
                <FileText className="size-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-sm font-medium">{d.title || DOC_TYPE_LABELS[d.type]}</p>
                <p className="text-xs text-muted-foreground">
                  {DOC_TYPE_LABELS[d.type]} • {formatDateTimeRo(d.issued_at)}
                  {d.signed && " • Semnat"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {d.signed && (
                <Badge variant="outline" className="text-brand-sage">
                  Validat
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
      {/* Hidden file input retained to keep ref shape stable for tests/automation. */}
      <input ref={fileRef} type="file" hidden />
    </div>
  );
}

function UploadDocumentDialog({
  open,
  onOpenChange,
  caseId,
  forcedType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  caseId: string;
  forcedType?: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>(forcedType ?? "id_card_deceased");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  // Sync forcedType when the trigger changes between rows.
  useMemo(() => {
    if (forcedType) setDocType(forcedType);
  }, [forcedType]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Selectați un fișier.");
    if (!title.trim()) return toast.error("Adăugați un titlu.");
    setUploading(true);
    try {
      await uploadDocument(caseId, file, docType, title.trim());
      toast.success("Document încărcat.");
      onOpenChange(false);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["case", caseId] });
    } catch (e: any) {
      toast.error(e.message ?? "Eroare la încărcare");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Încarcă document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tip document</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v)} disabled={!!forcedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id_card_deceased">CI/BI decedat</SelectItem>
                <SelectItem value="birth_certificate">Certificat de naștere decedat</SelectItem>
                <SelectItem value="marriage_certificate">Certificat de căsătorie</SelectItem>
                <SelectItem value="id_card_declarant">CI declarant</SelectItem>
                <SelectItem value="other">Alt document</SelectItem>
              </SelectContent>
            </Select>
            {forcedType && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tipul este pre-completat din lista de acte obligatorii.
              </p>
            )}
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
  );
}
