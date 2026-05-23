import { CASE_STATUS_LABELS, CASE_STATUS_ORDER } from "@/lib/legal";
import { Check } from "lucide-react";

const SHORT: Record<string, string> = {
  DRAFT: "Ciornă",
  AWAITING_DOCTOR: "Medic",
  CMCD_ISSUED: "CMCD",
  AWAITING_CIVIL_OFFICER: "St. Civilă",
  DEATH_CERT_ISSUED: "Certificat",
  FUNERAL_SCHEDULED: "Înmormântare",
  FUNERAL_COMPLETED: "Finalizat",
};

export function CaseStepper({ current }: { current: string }) {
  const idx = CASE_STATUS_ORDER.indexOf(current as any);
  const terminal = current === "FUNERAL_COMPLETED";
  const progress = terminal ? 100 : (idx / (CASE_STATUS_ORDER.length - 1)) * 100;
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Progresul dosarului
      </h2>
      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-brand-sage transition-all"
          style={{ width: `${Math.max(0, progress)}%` }}
        />
        <div className="relative flex justify-between">
          {CASE_STATUS_ORDER.map((s, i) => {
            const done = i < idx || (terminal && i <= idx);
            const active = i === idx && !terminal;
            return (
              <div key={s} className="flex flex-col items-center gap-2" title={CASE_STATUS_LABELS[s]}>
                <div
                  className={[
                    "z-10 flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-brand-sage text-white",
                    active && "border-2 border-brand-navy bg-card text-brand-navy",
                    !done && !active && "bg-muted text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={[
                    "max-w-[72px] text-center text-[10px] font-medium leading-tight",
                    active ? "font-bold text-brand-navy" : done ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {SHORT[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
