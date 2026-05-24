import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Phone, FileCheck, UserCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/emergency-24h")({
  head: () => ({
    meta: [
      { title: "Primele 24 de ore după deces — Ghid ExitusRO" },
      { name: "description", content: "Pașii esențiali în primele 24 de ore după un deces în România: apel medic, CMCD, declarare la Starea Civilă." },
      { property: "og:title", content: "Primele 24 de ore după deces — Ghid ExitusRO" },
      { property: "og:description", content: "Ce trebuie să faceți, în ordine, cu calm și conform legii." },
      { property: "og:url", content: "https://legatura-familiei.lovable.app/emergency-24h" },
    ],
    links: [{ rel: "canonical", href: "https://legatura-familiei.lovable.app/emergency-24h" }],
  }),
  component: Emergency,
});

function Emergency() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-brand-navy">Ghid: Primele 24 de ore</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vă rugăm păstrați calmul. Iată ce trebuie să faceți, în ordine.
        </p>

        <div className="mt-6 rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-brand-amber" />
            <div>
              <strong className="block text-sm">În caz de deces violent, suspect sau pe stradă: sunați la 112.</strong>
              <p className="mt-1 text-xs text-muted-foreground">Nu mutați corpul. Nu interveniți la fața locului.</p>
            </div>
          </div>
        </div>

        <ol className="mt-8 space-y-6">
          {[
            { icon: Phone, t: "1. Apelați medicul potrivit", d: "Pentru deces la domiciliu de cauză naturală: medicul de familie. Pentru deces într-o instituție medicală: documentul se eliberează acolo. Pentru cauze violente: 112 → IML." },
            { icon: FileCheck, t: "2. Obțineți CMCD", d: "Medicul constatator eliberează Certificatul Medical Constatator al Decesului. În platformă, acest pas se face digital — medicul semnează electronic." },
            { icon: UserCheck, t: "3. Anunțați la Starea Civilă", d: "În maxim 3 zile (L. 119/1996 art. 35) cu CMCD-ul, actul de identitate al decedatului și un act de identitate al dvs. La validare se emite certificatul de deces și adeverința de înhumare." },
          ].map((s) => (
            <li key={s.t} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy/5">
                <s.icon className="size-5 text-brand-navy" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold">{s.t}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-xl border border-brand-sage/20 bg-brand-sage/5 p-5">
          <h2 className="font-display text-base font-semibold text-brand-navy">Ce să NU faceți</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Nu plătiți serviciile funerare înainte să primiți o ofertă scrisă.</li>
            <li>• Nu semnați contracte sub presiune emoțională imediat după deces.</li>
            <li>• Nu uitați să blocați conturile bancare ale decedatului (notificare scrisă către bancă).</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
