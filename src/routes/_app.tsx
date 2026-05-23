import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth/login" });
  }, [loading, session, nav]);
  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Se încarcă...</div>;
  }
  return <AppShell><Outlet /></AppShell>;
}
