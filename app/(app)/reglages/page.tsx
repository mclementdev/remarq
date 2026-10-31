import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConsignmentScale, getSettings } from "@/lib/settings";
import { ScaleEditor } from "@/components/settings/ScaleEditor";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { BrandsManager } from "@/components/settings/BrandsManager";

export const metadata = { title: "Réglages" };

export default async function ReglagesPage() {
  const supabase = await createClient();
  const [settings, scale, { data: brands }, { data: usage }, { data: suggestions }] = await Promise.all([
    getSettings(supabase),
    getConsignmentScale(supabase),
    supabase.from("brands").select("id, name, active").order("name"),
    supabase.from("furnitures").select("brand_id").not("brand_id", "is", null),
    supabase.from("brand_suggestions").select("id, label").eq("status", "pending").order("created_at"),
  ]);

  const counts: Record<string, number> = {};
  for (const u of usage ?? []) if (u.brand_id) counts[u.brand_id] = (counts[u.brand_id] ?? 0) + 1;

  // Regroupe les suggestions de même libellé (insensible à la casse).
  const grouped = new Map<string, { id: string; label: string; count: number }>();
  for (const s of suggestions ?? []) {
    const key = s.label.trim().toLowerCase();
    const g = grouped.get(key);
    if (g) g.count++;
    else grouped.set(key, { id: s.id, label: s.label.trim(), count: 1 });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Réglages</h1>
        <Link href="/reglages/qr" className="btn-secondary btn-sm">QR codes du salon</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="params-title" className="panel p-5">
          <h2 id="params-title" className="section-title mb-4">Paramètres</h2>
          <SettingsForm settings={settings} />
        </section>
        <section aria-labelledby="brands-title" className="panel p-5">
          <h2 id="brands-title" className="section-title mb-4">Marques</h2>
          <BrandsManager
            brands={(brands ?? []).map((b) => ({ ...b, usage: counts[b.id] ?? 0 }))}
            suggestions={[...grouped.values()]}
          />
        </section>
        <section aria-labelledby="scale-title" className="panel p-5 lg:col-span-2">
          <h2 id="scale-title" className="section-title mb-4">Barème de partage (dépôt-vente)</h2>
          <ScaleEditor scale={scale} />
        </section>
      </div>
    </div>
  );
}
