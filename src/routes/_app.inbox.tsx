import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMyCases } from "@/lib/cases.functions";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { CASE_STATUS_LABELS } from "@/lib/legal";
import { formatDateTimeRo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/inbox")({ component: Inbox });

function Inbox() {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const { data, isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => listMyCases() });

  const filter = (status: string[]) => (data?.cases ?? []).filter((c) => status.includes(c.status));

  let pending: any[] = [];
  let title = "Inbox";
  let subtitle = "";
  if (role === "doctor") {
    pending = filter(["AWAITING_DOCTOR"]);
    title = "Inbox medic";
    subtitle = "Cazuri în așteptarea emiterii CMCD";
  } else if (role === "civil_officer") {
    pending = filter(["CMCD_ISSUED", "AWAITING_CIVIL_OFFICER"]);
    title = "Inbox Stare Civilă";
    subtitle = "Cazuri ce așteaptă validare și emitere certificat de deces";
  } else {
    pending = data?.cases ?? [];
    subtitle = "Cazurile la care aveți acces";
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-brand-navy">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-8 grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Se încarcă...</p>}
        {!isLoading && pending.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Niciun caz în așteptare.
          </div>
        )}
        {pending.map((c) => (
          <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-[10px]">{c.case_number}</Badge>
                  <span className="text-xs uppercase tracking-wide text-brand-amber">
                    {CASE_STATUS_LABELS[c.status]}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold">{c.deceased_full_name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deces: {formatDateTimeRo(c.deceased_dod)} • {c.city ?? "—"}, {c.county ?? "—"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
