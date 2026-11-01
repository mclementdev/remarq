import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SellPage } from "@/components/site/SellPage";
import { getConsignmentScale } from "@/lib/settings";
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
  const supabase = createAdminClient();
  const [{ data: brands }, scale] = await Promise.all([
    supabase.from("brands").select("id, name").eq("active", true).order("name"),
    getConsignmentScale(supabase),
  ]);

  return <SellPage brands={brands ?? []} scale={scale} source={source} salon={{ onSite, eyebrow: c.hero.eyebrow }} />;
}
