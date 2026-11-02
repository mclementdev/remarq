import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SellPage } from "@/components/site/SellPage";
import { SALON_SOURCES, type SalonSource } from "@/lib/content/salon";
import { vendreContent } from "@/lib/content/vendre";

export const metadata: Metadata = {
  title: "Vendre vos meubles de design",
  description: vendreContent.hero.text,
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

export default async function DepotPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const supabase = createAdminClient();
  const { data: brands } = await supabase.from("brands").select("id, name").eq("active", true).order("name");
  const known = (SALON_SOURCES as readonly string[]).includes(source ?? "") ? (source as SalonSource) : null;

  return <SellPage brands={brands ?? []} source={known} />;
}
