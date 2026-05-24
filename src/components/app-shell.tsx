import { Link } from "@tanstack/react-router";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/lib/legal";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const role = primaryRole(roles);
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const navItems: { to: string; label: string; show: boolean }[] = [
    { to: "/cases", label: "Cazurile mele", show: roles.includes("family") },
    { to: "/inbox", label: "Inbox", show: roles.includes("doctor") || roles.includes("civil_officer") || roles.includes("notary") || roles.includes("funeral_provider") },
    { to: "/notifications", label: "Notificări", show: true },
    { to: "/legal-library", label: "Bibliotecă legală", show: true },
    { to: "/emergency-24h", label: "Primele 24h", show: roles.includes("family") },
  ];

  return (
    <div className="min-h-screen bg-brand-muted">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-xl font-bold tracking-tight text-brand-navy">
              ExitusRO
            </Link>
            <div className="hidden h-6 w-px bg-border md:block" />
            <div className="hidden gap-6 text-sm font-medium md:flex">
              {navItems.filter((n) => n.show).map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="text-muted-foreground transition-colors hover:text-brand-navy [&.active]:text-brand-navy"
                  activeProps={{ className: "active" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium leading-tight">{user?.email}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {ROLE_LABELS[role]}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-semibold text-brand-navy">
              {initials}
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              Ieșire
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      <footer className="mt-20 border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground md:flex-row">
          <div>© 2026 ExitusRO. Digitalizarea procedurilor post-deces.</div>
          <div className="flex gap-6">
            <Link to="/legal-library" className="hover:text-brand-navy">Bibliotecă legală</Link>
            <span>Confidențialitate (GDPR)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
