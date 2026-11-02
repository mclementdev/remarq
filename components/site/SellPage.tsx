import { DepotForm } from "@/components/depot/DepotForm";
import { DepotIntro, DepotIntroHeader } from "@/components/depot/DepotIntro";
import { LeadForm } from "@/components/salon/LeadForm";
import { vendreContent as c } from "@/lib/content/vendre";
import { salonContent } from "@/lib/content/salon";
import type { SalonSource } from "@/lib/content/salon";

type Props = {
  brands: { id: string; name: string }[];
  source: SalonSource | null;
  /** Sur /salon : boutons d'ancre et bloc « Recevez le lien ». `onSite` (stand, carte, flyer) le place avant le formulaire. */
  salon?: { onSite: boolean; eyebrow: string };
};

const wrap = "mx-auto max-w-6xl px-4";

/** Page « Vendre » : servie par /depot et /salon. */
export function SellPage({ brands, source, salon }: Props) {
  const leadBlock = salon && source && (
    <section id="lien" aria-labelledby="lien-title" className="scroll-mt-6 py-12">
      <div className={wrap}>
        <div className="mx-auto max-w-2xl space-y-4 rounded-ui border border-line bg-paper-alt p-5 sm:p-8">
          <h2 id="lien-title" className="text-3xl sm:text-4xl">{salonContent.lead.title}</h2>
          <p className="text-ink-soft">{salonContent.lead.intro}</p>
          <LeadForm source={source} />
        </div>
      </div>
    </section>
  );

  return (
    <>
      <Hero salon={salon} />
      {salon?.onSite && leadBlock}

      <section id="formulaire" aria-label="Formulaire de reprise" className="scroll-mt-4 py-12 sm:py-16">
        {/* Mobile : accroche, formulaire, puis avantages. Ordinateur : présentation à gauche, formulaire à droite. */}
        <div className={`${wrap} grid gap-10 lg:grid-cols-[5fr_6fr] lg:grid-rows-[auto_1fr] lg:gap-x-14`}>
          <DepotIntroHeader />
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <DepotForm brands={brands} source={source} />
          </div>
          <DepotIntro />
        </div>
      </section>

      {salon && !salon.onSite && leadBlock}
      <HowItWorks />
      <Testimonials />
      <WhatWeTake />
      <Faq />
      <section className="bg-paper-alt py-14">
        <div className={`${wrap} space-y-3`}>
          <h2 className="text-4xl sm:text-5xl">{c.closing.title}</h2>
          <p className="max-w-md text-sm text-ink-soft">{c.closing.text}</p>
        </div>
      </section>
    </>
  );
}

function Hero({ salon }: { salon?: { onSite: boolean; eyebrow: string } }) {
  const linkBtn = <a key="lien" href="#lien" className={salon?.onSite ? "btn-primary px-6 py-3.5" : "btn-dark px-6 py-3.5"}>{c.salonButtons.link}</a>;
  const nowBtn = <a key="now" href="#formulaire" className={salon?.onSite ? "btn-dark px-6 py-3.5" : "btn-primary px-6 py-3.5"}>{c.salonButtons.now}</a>;
  return (
    <header className="bg-paper-alt pb-12 pt-12 sm:pt-20">
      <div className={`${wrap} space-y-5`}>
        {salon && <p className="section-title">{salon.eyebrow}</p>}
        <h1 className="text-5xl sm:text-7xl">{c.hero.title}</h1>
        <p className="max-w-xl text-sm text-ink-soft sm:text-base">{c.hero.text}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {c.hero.checks.map((t) => (
            <li key={t}><span aria-hidden>✓</span> {t}</li>
          ))}
        </ul>
        {salon && <div className="flex flex-col gap-3 pt-3 sm:flex-row">{salon.onSite ? [linkBtn, nowBtn] : [nowBtn, linkBtn]}</div>}
      </div>
    </header>
  );
}

function HowItWorks() {
  const h = c.howItWorks;
  return (
    <section id="comment-ca-marche" aria-labelledby="comment-title" className="scroll-mt-4 bg-[#111] py-14 text-white sm:py-16">
      <div className={`${wrap} space-y-8`}>
        <div className="space-y-3">
          <p className="text-sm text-white/75">{h.eyebrow}</p>
          <h2 id="comment-title" className="text-4xl sm:text-5xl">{h.title}</h2>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {h.steps.map((s, i) => (
            <li key={s.title} className="space-y-3 rounded-ui border border-white/20 p-5">
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 text-xs">{i + 1}</span>
              <p className="text-lg">{s.title}</p>
              <p className="text-sm text-white/75">{s.text}</p>
            </li>
          ))}
        </ol>
        <a href="#formulaire" className="btn-primary px-6 py-3.5">{h.cta}</a>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = c.testimonials;
  return (
    <section aria-labelledby="avis-title" className="bg-paper-alt py-14 sm:py-16">
      <div className={`${wrap} space-y-8`}>
        <div className="space-y-3 text-center">
          <p className="section-title">{t.eyebrow}</p>
          <h2 id="avis-title" className="text-4xl sm:text-5xl">{t.title}</h2>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {t.items.map((r) => (
            <li key={r.author} className="space-y-4 rounded-ui bg-paper p-5">
              <p aria-label="5 étoiles sur 5" className="tracking-widest">★★★★★</p>
              <blockquote className="text-sm">« {r.text} »</blockquote>
              <p className="text-sm"><strong className="font-semibold">{r.author}</strong><span className="text-ink-soft"> · {r.place}</span></p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WhatWeTake() {
  const w = c.whatWeTake;
  return (
    <section aria-labelledby="prenons-title" className="py-14 sm:py-16">
      <div className={`${wrap} space-y-8`}>
        <div className="space-y-3">
          <p className="section-title">{w.eyebrow}</p>
          <h2 id="prenons-title" className="text-4xl sm:text-5xl">{w.title}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-ui bg-paper-alt p-5 sm:p-6">
            <h3 className="text-lg">{w.yesTitle}</h3>
            <ul className="space-y-1.5 text-sm">
              {w.yes.map((l) => <li key={l} className="flex gap-3"><span aria-hidden>✓</span>{l}</li>)}
            </ul>
            <ul className="flex flex-wrap gap-2" aria-label="Exemples de marques">
              {w.brands.map((b) => <li key={b} className="rounded-full border border-line px-3 py-1 text-xs">{b}</li>)}
            </ul>
          </div>
          <div className="space-y-4 rounded-ui bg-paper-alt p-5 sm:p-6">
            <h3 className="text-lg">{w.noTitle}</h3>
            <ul className="space-y-1.5 text-sm">
              {w.no.map((l) => <li key={l} className="flex gap-3"><span aria-hidden>–</span>{l}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const f = c.faq;
  return (
    <section aria-labelledby="faq-title" className="py-14 sm:py-16">
      <div className={`${wrap} max-w-3xl space-y-8 sm:mx-auto`}>
        <div className="space-y-3 text-center">
          <p className="section-title">{f.eyebrow}</p>
          <h2 id="faq-title" className="text-4xl sm:text-5xl">{f.title}</h2>
        </div>
        <div className="border-t border-line">
          {f.items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <p className="pb-5 text-sm text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
