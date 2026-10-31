import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepotForm } from "@/components/depot/DepotForm";
import { LeadForm } from "@/components/salon/LeadForm";
import { ON_SITE_SOURCES, parseSource, salonContent as c } from "@/lib/content/salon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: c.meta.title,
  description: c.meta.description,
  robots: { index: true, follow: true },
  alternates: { canonical: "/salon" },
  openGraph: { title: `${c.meta.title} · Remarq`, description: c.meta.description, type: "website", locale: "fr_FR", siteName: "Remarq", url: "/salon" },
  twitter: { card: "summary_large_image", title: c.meta.title, description: c.meta.description },
};

export default async function SalonPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const source = parseSource((await searchParams).source);
  const onSite = ON_SITE_SOURCES.includes(source);
  const { data: brands } = await createAdminClient().from("brands").select("id, name").eq("active", true).order("name");

  const leadBlock = (
    <section id="lien" aria-labelledby="lien-title" className="scroll-mt-6 space-y-4 rounded-ui border border-line bg-paper p-5 sm:p-6">
      <h2 id="lien-title" className="text-xl">{c.lead.title}</h2>
      <p className="text-ink-soft">{c.lead.intro}</p>
      <LeadForm source={source} />
    </section>
  );

  return (
    <div className="space-y-12">
      <header className="space-y-4 text-center">
        <p className="section-title">{c.hero.eyebrow}</p>
        <h1 className="text-3xl leading-tight sm:text-4xl">{c.hero.title}</h1>
        <p className="text-ink-soft">{c.hero.promise}</p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          {onSite ? (
            <>
              <a href="#lien" className="btn-primary py-4">{c.lead.title}</a>
              <a href="#formulaire" className="btn-secondary py-4">{c.form.ctaNow}</a>
            </>
          ) : (
            <>
              <a href="#formulaire" className="btn-primary py-4">{c.form.ctaNow}</a>
              <a href="#lien" className="btn-secondary py-4">{c.lead.title}</a>
            </>
          )}
        </div>
      </header>

      {onSite && leadBlock}

      <section aria-labelledby="etapes-title">
        <h2 id="etapes-title" className="sr-only">Comment ça marche</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {c.steps.map((s, i) => (
            <li key={s.title} className="space-y-1 border-t-2 border-accent pt-3">
              <p className="text-sm font-bold text-accent">{i + 1}</p>
              <p className="font-bold">{s.title}</p>
              <p className="text-sm text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {!onSite && leadBlock}

      <section id="formulaire" aria-labelledby="formulaire-title" className="scroll-mt-6 space-y-6 border-t border-line pt-10">
        <div className="space-y-2 text-center">
          <h2 id="formulaire-title" className="text-2xl">{c.form.title}</h2>
          <p className="text-ink-soft">{c.form.intro}</p>
        </div>
        <DepotForm brands={brands ?? []} />
      </section>
    </div>
  );
}
