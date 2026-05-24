import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/legal-library")({
  head: () => ({
    meta: [
      { title: "Bibliotecă legală post-deces — ExitusRO" },
      { name: "description", content: "Acte normative aplicabile în procedurile post-deces: L. 119/1996, L. 102/2014, L. 263/2010, L. 36/1995, Cod Civil, Cod Fiscal." },
      { property: "og:title", content: "Bibliotecă legală post-deces — ExitusRO" },
      { property: "og:description", content: "Referințe legislative cheie pentru declarare, înhumare și succesiune." },
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
  { id: "ccciv953", title: "Codul Civil art. 953 și urm. — Moșteniri", summary: "Regulile generale ale devoluțiunii moștenirii: clase de moștenitori, rezerva succesorală, acceptare și renunțare." },
  { id: "l36", title: "Legea 36/1995 — Notarii publici", summary: "Competența notarială în procedura succesorală, dezbaterea, certificatul de moștenitor." },
  { id: "cfisc111", title: "Codul Fiscal art. 111 — Impozit transfer imobile", summary: "Termenul de 2 ani pentru dezbaterea succesiunii fără taxe suplimentare. După 2 ani se aplică 1% impozit asupra masei succesorale." },
];

function Legal() {
  return (
    <AppShell>
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
    </AppShell>
  );
}
