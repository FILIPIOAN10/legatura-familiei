import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Stethoscope,
  Building,
  FileText,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExitusRO — Proceduri digitale post-deces în România" },
      {
        name: "description",
        content:
          "Platformă care însoțește familiile, medicii și funcționarii prin pașii legali după un deces: CMCD, certificat de deces, înmormântare, succesiune.",
      },
      { property: "og:title", content: "ExitusRO — Proceduri digitale post-deces" },
      {
        property: "og:description",
        content: "De la CMCD la certificatul de moștenitor, cu termene legale monitorizate.",
      },
      { property: "og:url", content: "https://legatura-familiei.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://legatura-familiei.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-brand-muted/40 font-sans selection:bg-brand-sage/20 selection:text-brand-navy">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-3 select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-navy font-display text-xs font-bold text-white tracking-wider">
                EX
              </div>
              <span className="font-display text-lg font-bold text-brand-navy">ExitusRO</span>
            </div>
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#cum-functioneaza"
                className="text-sm font-medium text-muted-foreground hover:text-brand-navy transition-colors"
              >
                Cum funcționează
              </a>
              <a
                href="#caracteristici"
                className="text-sm font-medium text-muted-foreground hover:text-brand-navy transition-colors"
              >
                Caracteristici
              </a>
              <Link
                to="/emergency-24h"
                className="text-sm font-medium text-muted-foreground hover:text-brand-navy transition-colors"
              >
                Ghid 24h
              </Link>
              <Link
                to="/legal-library"
                className="text-sm font-medium text-muted-foreground hover:text-brand-navy transition-colors"
              >
                Legi
              </Link>
            </div>
          </div>
          {/* Auth Section */}
          <div className="flex items-center gap-4">
            <Link
              to="/auth/login"
              className="text-sm font-semibold text-muted-foreground hover:text-brand-navy transition-colors"
            >
              Autentificare
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold rounded-lg px-4 py-2 flex items-center gap-1.5 shadow-sm">
                Începe acum <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center md:pt-28 md:pb-24">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-navy sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-[1.12]">
          Birocrația post-deces,{" "}
          <span className="relative inline-block whitespace-nowrap">
            digitalizată.
            <span className="absolute left-0 bottom-1 sm:bottom-2 -z-10 h-[6px] w-full rounded-full bg-brand-sage/35 sm:h-[8px]" />
          </span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          ExitusRO însoțește familiile prin procedurile administrative după pierderea unei
          persoane dragi — de la CMCD la certificatul de deces — cu respect, claritate
          și termene legale monitorizate.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/auth/signup">
            <Button
              size="lg"
              className="bg-brand-navy hover:bg-brand-navy/90 text-white text-sm font-semibold rounded-lg px-7 py-6 shadow-md shadow-brand-navy/10 hover:shadow-lg hover:shadow-brand-navy/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2"
            >
              Deschide un dosar <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link to="/emergency-24h">
            <Button
              size="lg"
              variant="outline"
              className="border-border/60 hover:bg-white text-sm font-semibold rounded-lg px-7 py-6 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm"
            >
              Ghid primele 24h
            </Button>
          </Link>
        </div>

        {/* Benefits Checks */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-muted-foreground">
          {[
            "L. 119/1996 — Actele de stare civilă",
            "L. 102/2014 — Servicii funerare",
            "GDPR compliant",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 font-medium">
              <div className="flex size-4 items-center justify-center rounded-full bg-brand-sage/10 text-brand-sage">
                <Check className="size-3 stroke-[3]" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Strip Section */}
      <section className="border-y border-border/40 bg-white/50 backdrop-blur-sm py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y divide-border/20 md:divide-y-0 md:divide-x divide-border/20">
            {[
              { val: "242.918", desc: "decese înregistrate în România în 2023" },
              { val: "664", desc: "decese în medie în fiecare zi" },
              { val: "3 zile", desc: "termen legal de declarare — L. 119/1996" },
              { val: "7 copii", desc: "ale certificatului de deces necesare în medie" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center px-4 pt-6 md:pt-0">
                <div className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-navy">
                  {stat.val}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[200px] mx-auto font-medium">
                  {stat.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-[10px] sm:text-xs text-muted-foreground/60 italic font-medium">
            Sursă: Institutul Național de Statistică — Evenimente demografice în anul 2023
          </p>
        </div>
      </section>

      {/* Cum Funcționează Section */}
      <section id="cum-functioneaza" className="bg-brand-muted/20 py-20 md:py-24 border-b border-border/30 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-sage">
              Cum funcționează
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
              De la notificare la dosar complet
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground font-medium">
              Patru pași, patru actori, zero hârtie pierdută.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                role: "Aparținător",
                title: "Deschideți dosarul",
                desc: "Aparținătorul completează datele decedatului online. Medicul este notificat automat.",
                icon: Heart,
                bgClass: "bg-[#F0F5FA] text-[#4A8EC3]",
              },
              {
                step: "02",
                role: "Medic constatator",
                title: "Medicul emite CMCD",
                desc: "Certificatul Medical Constatator al Decesului se semnează digital și ajunge la Starea Civilă.",
                icon: Stethoscope,
                bgClass: "bg-[#F2FAF5] text-[#4FA16D]",
              },
              {
                step: "03",
                role: "Funcționar stare civilă",
                title: "Starea Civilă validează",
                desc: "Funcționarul verifică actele, înregistrează decesul în SIIEASC și emite certificatul.",
                icon: Building,
                bgClass: "bg-[#FDF7F2] text-[#D48F56]",
              },
              {
                step: "04",
                role: "Casă funerară",
                title: "Servicii funerare",
                desc: "Casa funerară este notificată. Familia alege furnizorul și programează înmormântarea.",
                icon: FileText,
                bgClass: "bg-[#F4F6FB] text-[#556993]",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative bg-white rounded-2xl border border-border/40 p-6 md:p-8 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-border/60 hover:scale-[1.01] transition-all duration-300 flex flex-col group"
              >
                <div className="absolute top-6 right-6 font-display text-4xl sm:text-5xl font-extrabold text-muted/20 select-none group-hover:text-muted/30 transition-colors">
                  {s.step}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 shadow-sm ${s.bgClass}`}>
                  <s.icon className="size-5" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-brand-sage uppercase mb-1">
                  {s.role}
                </span>
                <h3 className="font-display text-base sm:text-lg font-bold text-brand-navy mb-3">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Timeline Connector Line */}
          <div className="hidden lg:flex max-w-4xl mx-auto items-center justify-between px-16 mt-16 relative select-none">
            <div 
              className="absolute left-[70px] right-[70px] top-1/2 -translate-y-1/2 h-[3px] -z-10" 
              style={{ background: "linear-gradient(to right, oklch(0.62 0.06 145) 33.3%, #cbd5e1 33.3%)" }}
            />
            {[
              { num: "01", active: true },
              { num: "02", active: true },
              { num: "03", active: false },
              { num: "04", active: false },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-display text-xs font-bold transition-all duration-300 ${
                    step.active
                      ? "bg-white border-brand-sage text-brand-navy shadow-sm scale-110"
                      : "bg-white border-border text-muted-foreground"
                  }`}
                >
                  {step.num}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caracteristici Section */}
      <section id="caracteristici" className="bg-white py-20 md:py-24 border-b border-border/30 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-sage">
              Caracteristici
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
              Tot ce aveți nevoie, într-un singur loc
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {[
              {
                icon: Clock,
                title: "Termene legale monitorizate",
                desc: "3 zile pentru declarare (L. 119/1996 art. 35). 24–72h pentru înhumare (L. 102/2014). Toate urmărite automat.",
              },
              {
                icon: Shield,
                title: "Documente în siguranță",
                desc: "CI/BI decedat, certificate de naștere și căsătorie — încărcate o singură dată, accesibile tuturor actorilor autorizați.",
              },
              {
                icon: Users,
                title: "Toate rolurile, o singură platformă",
                desc: "Familie, medic, funcționar, casă funerară și notar — fiecare vede exact ce are de făcut.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-start px-2">
                <div className="w-12 h-12 rounded-xl bg-[#F4F6FB] text-brand-navy flex items-center justify-center mb-5 shadow-sm">
                  <item.icon className="size-5" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-brand-navy mb-3">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pentru Cine / Layout Split Section */}
      <section className="bg-brand-muted/20 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Description Column */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-sage">
              Pentru cine
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
              O platformă, mai multe roluri
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
              Fiecare actor din procesul post-deces are propriul inbox, propriile acțiuni și
              propriile termene.
            </p>

            <div className="mt-8 space-y-4 w-full">
              {[
                {
                  role: "Aparținător (familie)",
                  action: "Deschide dosarul, urmărește pașii, încarcă documente",
                },
                {
                  role: "Medic constatator",
                  action: "Emite CMCD digital, notifică Starea Civilă",
                },
                {
                  role: "Funcționar Stare Civilă",
                  action: "Validează actele, înregistrează în SIIEASC, emite certificatul",
                },
                {
                  role: "Casă funerară",
                  action: "Preia notificarea, programează înmormântarea",
                },
              ].map((roleInfo, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-sage/10 text-brand-sage">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <strong className="text-brand-navy font-semibold">{roleInfo.role}</strong>
                    <span className="text-muted-foreground font-medium"> — {roleInfo.action}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/auth/signup" className="mt-10">
              <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white text-sm font-semibold rounded-lg px-6 py-4.5 shadow-md shadow-brand-navy/10 hover:shadow-lg transition-all flex items-center gap-2">
                Creează cont gratuit <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          {/* Right Mock UI Column */}
          <div className="relative">
            {/* Status Tracker Mockup Card */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.05)] p-6 sm:p-8 max-w-sm mx-auto w-full relative overflow-hidden transition-all duration-500 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 select-none">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-navy font-display text-[8px] font-bold text-white tracking-wider">
                    EX
                  </div>
                  <span className="font-display text-xs font-bold text-brand-navy">ExitusRO</span>
                </div>
                <span className="bg-[#EAF6ED] text-[#28844B] text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                  CMCD Emis
                </span>
              </div>

              {/* Skeletal lines */}
              <div className="space-y-2 mt-5">
                <div className="w-2/3 h-2 bg-muted/50 rounded" />
                <div className="w-1/2 h-2 bg-muted/30 rounded" />
              </div>

              {/* Steps status check */}
              <div className="mt-6 space-y-4">
                {[
                  { name: "Notifică medicul", checked: true },
                  { name: "Emitere CMCD", checked: true },
                  { name: "Validare Starea Civilă", checked: false },
                  { name: "Certificat de deces", checked: false },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3.5">
                    {step.checked ? (
                      <div className="flex size-4.5 items-center justify-center rounded-full bg-brand-sage text-white shadow-sm">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="size-4.5 rounded-full border-2 border-border/80 bg-white" />
                    )}
                    <span
                      className={`text-xs sm:text-sm font-semibold transition-colors ${
                        step.checked ? "text-brand-navy" : "text-muted-foreground/70"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legal term alert notification box */}
              <div className="mt-6 bg-[#FEFAF3] border border-[#FADFB4]/30 rounded-xl p-3.5 flex items-start gap-3">
                <AlertCircle className="size-4 text-[#D48F56] shrink-0 mt-0.5" />
                <span className="text-[10px] sm:text-xs font-bold text-[#8B562A] leading-relaxed">
                  Termen: 3 zile — L. 119/1996 art. 35
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-navy py-20 text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            În momentele grele, tehnologia poate ajuta.
          </h2>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto text-sm sm:text-base font-medium leading-relaxed font-medium">
            ExitusRO reduce birocrația și oferă claritate familiilor și instituțiilor în cele mai dificile momente.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth/signup">
              <Button className="bg-white hover:bg-white/90 text-brand-navy font-semibold rounded-lg px-6 py-3.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2">
                Deschide un dosar <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" className="border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg px-6 py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm">
                Autentificare
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border/40 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          {/* Left Brand Area */}
          <div className="flex items-center gap-3 select-none">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-navy font-display text-[9px] font-bold text-white tracking-wider">
              EX
            </div>
            <span className="font-display text-xs font-bold text-brand-navy">ExitusRO</span>
            <span className="text-muted-foreground/60">|</span>
            <span>© 2026 — Digitalizarea procedurilor post-deces</span>
          </div>
          {/* Right Footer Links */}
          <div className="flex items-center gap-6">
            <Link to="/legal-library" className="hover:text-brand-navy transition-colors">
              Bibliotecă legală
            </Link>
            <Link to="/emergency-24h" className="hover:text-brand-navy transition-colors">
              Ghid 24h
            </Link>
            <span className="cursor-default text-muted-foreground/40">GDPR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

