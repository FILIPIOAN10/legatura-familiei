import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead } from "@/lib/notifications.functions";
import { formatDateTimeRo } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/notifications")({ component: NotifPage });

function NotifPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => listNotifications() });
  const mark = useMutation({
    mutationFn: (id: string) => markNotificationRead({ id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Notificări</h1>
      <p className="mt-1 text-sm text-muted-foreground">Toate evenimentele legate de dosarele dvs.</p>
      <div className="mt-8 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Se încarcă...</p>}
        {!isLoading && (data?.notifications ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nicio notificare.
          </div>
        )}
        {data?.notifications?.map((n) => (
          <div key={n.id} className={`rounded-xl border border-border bg-card p-5 ${!n.read_at ? "border-l-4 border-l-brand-sage" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">{formatDateTimeRo(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <Button variant="ghost" size="sm" onClick={() => mark.mutate(n.id)}>
                  Marchează citită
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
