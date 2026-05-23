import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createCase } from "@/lib/cases.functions";

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

  const seedCluj = async () => {
    localStorage.removeItem("dev_cases_v1");
    localStorage.removeItem("dev_documents_v1");
    localStorage.removeItem("dev_notifications_v1");
    const res = await createCase({
      deceased_full_name: "Ioan Popescu",
      deceased_dob: "1945-01-01",
      deceased_dod: new Date().toISOString(),
      death_cause_type: "natural",
      death_location: "Domiciliu",
      city: "Cluj-Napoca",
      county: "Cluj",
      address: "Str. Memorandumului 1",
    });
    toast.success("Caz demo Cluj creat.");
    setTimeout(
      () => navigate({ to: "/cases/$caseId", params: { caseId: res.case.id } }),
      400,
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Date demo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Șterge toate dosarele, documentele și notificările create în această sesiune demo, sau
        creează un singur dosar demo în Cluj-Napoca.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={seedCluj}>Creează un dosar demo în Cluj</Button>
        <Button onClick={wipe} variant="destructive">
          Șterge toate înregistrările
        </Button>
      </div>
    </div>
  );
}
