import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMyCases } from "@/lib/cases.functions";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CASE_STATUS_LABELS } from "@/lib/legal";
import { formatDateTimeRo } from "@/lib/format";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/_app/cases/")({ component: CasesPage });

function CasesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => listMyCases() });
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const count = data?.cases?.length ?? 0;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Se încarcă...</p>;
  }

  // The aparținător's very first action is to notify the doctor — when they
  // have no cases yet (including on a fresh dev login as `demo.family`), we
  // render the "Notifică medicul" screen instead of an empty case list.
  if (role === "family" && count === 0) {
    return <Navigate to="/cases/new" replace />;
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy">Cazurile mele</h1>
          <p className="mt-1 text-sm text-muted-foreground">Toate dosarele la care aveți acces.</p>
        </div>
        <Link to="/cases/new">
          <Button className="bg-brand-navy hover:bg-brand-navy/90"><Stethoscope className="mr-2 size-4" />Notifică medicul</Button>
        </Link>
      </div>

      {count === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <h3 className="font-display font-semibold">Nu aveți cazuri active</h3>
          <p className="mt-2 text-sm text-muted-foreground">Nu există dosare care vă sunt asociate momentan.</p>
        </div>
      )}

      <div className="grid gap-4">
        {data?.cases?.map((c) => (
          <Link
            key={c.id}
            to="/cases/$caseId"
            params={{ caseId: c.id }}
            className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-[10px]">{c.case_number}</Badge>
                  <span className="text-xs uppercase tracking-wide text-brand-sage">
                    {CASE_STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold">{c.deceased_full_name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deces: {formatDateTimeRo(c.deceased_dod)} • {c.city ?? "—"}, {c.county ?? "—"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{formatDateTimeRo(c.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
