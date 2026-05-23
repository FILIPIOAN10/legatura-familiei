import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/seed")({ component: SeedPage });

function SeedPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Date demo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Generarea datelor demo este disponibilă direct prin backend. Folosiți scripturile de seed din proiectul FastAPI.
      </p>
    </div>
  );
}
