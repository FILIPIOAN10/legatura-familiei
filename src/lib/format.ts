export function maskCnp(cnp: string | null | undefined): string {
  if (!cnp) return "—";
  if (cnp.length < 4) return "•••";
  return "•".repeat(cnp.length - 4) + cnp.slice(-4);
}

export function formatDateRo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDateTimeRo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("ro-RO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function hoursRemaining(deadline: string | Date): number {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60)));
}

export function formatRemaining(deadline: string | Date): string {
  const h = hoursRemaining(deadline);
  if (h === 0) return "Termen depășit";
  if (h < 48) return `${h} ore rămase`;
  return `${Math.round(h / 24)} zile rămase`;
}
