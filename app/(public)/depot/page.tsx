import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepotForm } from "@/components/depot/DepotForm";
import { DepotIntro, DepotIntroHeader } from "@/components/depot/DepotIntro";
import { getConsignmentScale } from "@/lib/settings";
import { SALON_SOURCES } from "@/lib/content/salon";
import { depotContent } from "@/lib/content/depot";

export const metadata: Metadata = {
  title: "Vendre vos meubles de design",
  description: depotContent.intro.text,
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default async function DepotPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: brands }, scale] = await Promise.all([
    supabase.from("brands").select("id, name").eq("active", true).order("name"),
    getConsignmentScale(supabase),
  ]);

  return (
    // Mobile : accroche, formulaire, puis avantages et barème. Ordinateur : présentation à gauche, formulaire à droite.
    <div className="grid gap-10 lg:grid-cols-[5fr_6fr] lg:grid-rows-[auto_1fr] lg:gap-x-14">
      <DepotIntroHeader />
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <DepotForm brands={brands ?? []} source={(SALON_SOURCES as readonly string[]).includes(source ?? "") ? source : null} />
      </div>
      <DepotIntro scale={scale} />
    </div>
  );
}
