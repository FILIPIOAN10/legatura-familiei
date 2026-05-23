import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { hasAuthCookie } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const Route = createFileRoute("/auth/signup")({
  beforeLoad: () => {
    if (hasAuthCookie()) throw redirect({ to: "/cases" });
  },
  head: () => ({
    meta: [
      { title: "Creați cont — ExitusRO" },
      { name: "description", content: "Crearea conturilor este momentan dezactivată." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Signup,
});

function Signup() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 block font-display text-xl font-bold text-brand-navy">
          ExitusRO
        </Link>
        <h1 className="font-display text-2xl font-bold">Creare cont</h1>

        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Crearea conturilor este momentan dezactivată</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            În această versiune, conturile sunt pre-create de administrator pentru fiecare rol
            (aparținător, medic, funcționar Stare Civilă, casă funerară). Pentru a obține acces,
            contactați administratorul platformei.
          </AlertDescription>
        </Alert>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Aveți cont?{" "}
          <Link to="/auth/login" className="font-medium text-brand-navy hover:underline">
            Autentificare
          </Link>
        </p>
      </div>
    </div>
  );
}
