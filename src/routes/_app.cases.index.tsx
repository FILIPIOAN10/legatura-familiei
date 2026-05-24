import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCases, type ApiCase } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { formatDateTimeRo } from "@/lib/format";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/_app/cases/")({ component: CasesPage });

const CASE_TYPE_LABELS: Record<string, string> = {
  violenta: "Violentă",
  suspecta: "Suspectă",
  necunoscuta: "Necunoscută",
};

function CasesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => listCases() });

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy">Cazurile mele</h1>
          <p className="mt-1 text-sm text-muted-foreground">Toate dosarele la care aveți acces.</p>
        </div>
        <Link to="/cases/new">
          <Button className="bg-brand-navy hover:bg-brand-navy/90">
            <Stethoscope className="mr-2 size-4" />
            Dosar nou
          </Button>
        </Link>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Se încarcă...</p>}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <h3 className="font-display font-semibold">Nu aveți cazuri active</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pentru a începe, creați un dosar nou cu datele decedatului.
          </p>
          <Link to="/cases/new" className="mt-4 inline-block">
            <Button className="bg-brand-navy hover:bg-brand-navy/90">
              <Stethoscope className="mr-2 size-4" />
              Dosar nou
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {data?.map((c: ApiCase) => (
          <Link
            key={c.id}
            to="/cases/$caseId"
            params={{ caseId: String(c.id) }}
            className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">#{c.id}</span>
                  <span className="text-xs uppercase tracking-wide text-brand-sage">
                    {CASE_TYPE_LABELS[c.case_type] ?? c.case_type}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold">{c.fullname}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deces: {formatDateTimeRo(c.datetime_of_death)} • {c.localitate}, {c.judet}
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
