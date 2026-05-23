import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/seed")({ component: SeedPage });

function SeedPage() {
  const navigate = useNavigate();

  const wipe = () => {
    localStorage.removeItem("dev_cases_v1");
    localStorage.removeItem("dev_documents_v1");
    localStorage.removeItem("dev_notifications_v1");
    toast.success("Toate înregistrările demo au fost șterse.");
    setTimeout(() => navigate({ to: "/cases" }), 400);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Date demo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Șterge toate dosarele, documentele și notificările create în această sesiune demo.
      </p>
      <Button onClick={wipe} variant="destructive" className="mt-6">
        Șterge toate înregistrările
      </Button>
    </div>
  );
}
