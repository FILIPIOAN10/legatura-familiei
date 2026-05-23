import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-brand-muted">
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-xl font-bold text-brand-navy">ExitusRO</span>
          <div className="flex gap-3">
            <Link to="/auth/login"><Button variant="outline" size="sm">Autentificare</Button></Link>
            <Link to="/auth/signup"><Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90">Creează cont</Button></Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-sage">Platformă digitală oficială</p>
        <h1 className="font-display text-5xl font-bold tracking-tight text-brand-navy md:text-6xl">
          Vă însoțim în pașii legali după pierderea unei persoane dragi.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          ExitusRO digitalizează întregul proces administrativ post-deces — de la certificatul medical constatator,
          la certificatul de deces, înmormântare și succesiune. Cu respect, claritate și termene legale monitorizate.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/auth/signup"><Button size="lg" className="bg-brand-navy hover:bg-brand-navy/90">Începe un dosar</Button></Link>
          <Link to="/emergency-24h"><Button size="lg" variant="outline">Ghid primele 24h</Button></Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { t: "Pentru aparținători", d: "Pas cu pas, în limbaj clar, cu toate documentele într-un singur loc." },
            { t: "Pentru medici și funcționari", d: "Inbox digital pentru CMCD și validare la Starea Civilă." },
            { t: "Termene legale", d: "Monitorizate automat cu referințe la lege (L. 119/1996, L. 102/2014)." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-brand-navy">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-brand-sage/20 bg-brand-sage/5 p-6">
          <p className="text-sm text-muted-foreground">
            Pentru a vedea platforma cu date demo (familie, medic, funcționar), accesați{" "}
            <Link to="/seed" className="font-semibold text-brand-navy hover:underline">/seed</Link> după autentificare.
          </p>
        </div>
      </main>
    </div>
  );
}
