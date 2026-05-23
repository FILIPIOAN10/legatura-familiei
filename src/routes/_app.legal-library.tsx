import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/legal-library")({
  head: () => ({
    meta: [
      { title: "Bibliotecă legală post-deces — ExitusRO" },
      { name: "description", content: "Acte normative aplicabile în procedurile post-deces: L. 119/1996, L. 102/2014, L. 263/2010." },
      { property: "og:title", content: "Bibliotecă legală post-deces — ExitusRO" },
      { property: "og:description", content: "Referințe legislative cheie pentru declarare, certificat de deces și înhumare." },
      { property: "og:url", content: "https://legatura-familiei.lovable.app/legal-library" },
    ],
    links: [{ rel: "canonical", href: "https://legatura-familiei.lovable.app/legal-library" }],
  }),
  component: Legal,
});

const LAWS = [
  { id: "l119", title: "Legea 119/1996 — Actele de stare civilă", summary: "Reglementează declararea decesului, eliberarea certificatului de deces, termenele și sancțiunile. Art. 35 stabilește termenul de 3 zile pentru declarare." },
  { id: "l102", title: "Legea 102/2014 — Cimitire și servicii funerare", summary: "Stabilește regulile pentru înhumare, incinerare, transport funerar, autorizarea caselor funerare și termenele între 24h și 72h de la deces." },
  { id: "l263", title: "Legea 263/2010 — Sistemul unitar de pensii publice", summary: "Reglementează ajutorul de înmormântare acordat aparținătorilor și pensia de urmaș." },
];

function Legal() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-brand-navy">Bibliotecă legală</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acte normative relevante în procedurile post-deces din România.
      </p>
      <div className="mt-8 space-y-4">
        {LAWS.map((l) => (
          <article key={l.id} className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold text-brand-navy">{l.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.summary}</p>
          </article>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Informațiile au caracter orientativ. Versiunile actuale ale legilor sunt disponibile pe portalul legislativ oficial.
      </p>
    </div>
  );
}
