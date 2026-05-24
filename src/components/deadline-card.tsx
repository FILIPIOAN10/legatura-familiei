import { useEffect, useState } from "react";
import { hoursRemaining } from "@/lib/format";

export function DeadlineCard({
  deadline,
  legalRef,
  label,
}: {
  deadline: string;
  legalRef: string;
  label: string;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const h = hoursRemaining(deadline);
  const pct = Math.min(100, Math.max(0, (h / 72) * 100));
  const isUrgent = h <= 24;
  return (
    <div className="rounded-xl bg-brand-navy p-6 text-white shadow-lg">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/60">
        Termen legal limită
      </h3>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-display text-4xl font-light">{h}</span>
        <span className="text-lg opacity-80">ore rămase</span>
      </div>
      <p className="text-xs leading-relaxed opacity-70">{label}</p>
      <div className="mt-6 h-1 w-full rounded-full bg-white/10">
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: isUrgent ? "var(--brand-amber)" : "var(--brand-sage)" }}
        />
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wide text-white/50">{legalRef}</p>
    </div>
  );
}
