import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateListing, ListingError, toStoredListings } from "@/lib/ai/listing";
import { CATEGORY_LABELS, CONDITION_LABELS, TIME_TYPE_LABELS, type Category, type Condition, type TimeType } from "@/lib/labels";
import { formatNumber } from "@/lib/format";
import { itemTypeLabel } from "@/lib/depot/item-types";

export const maxDuration = 120;

const bodySchema = z.object({
  target: z.enum(["both", "site", "lbc"]).default("both"),
  instruction: z.string().trim().max(500).nullish(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Meuble introuvable." }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });

  const [{ data: f }, { data: notes }, { data: time }, { count: certificates }] = await Promise.all([
    supabase.from("furniture_overview").select("*").eq("id", id).maybeSingle(),
    supabase.from("notes").select("body").eq("furniture_id", id).order("created_at"),
    supabase.from("time_entries").select("type, hours, note").eq("furniture_id", id),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("furniture_id", id).eq("kind", "certificate"),
  ]);
  if (!f) return NextResponse.json({ error: "Meuble introuvable." }, { status: 404 });

  const dims = [f.width_cm, f.depth_cm, f.height_cm].some((d) => d !== null)
    ? `L ${formatNumber(f.width_cm)} × P ${formatNumber(f.depth_cm)} × H ${formatNumber(f.height_cm)} cm`
    : null;
  const works = (time ?? [])
    .filter((t) => t.type === "cleaning" || t.type === "repair" || t.note)
    .map((t) => `${TIME_TYPE_LABELS[t.type as TimeType]}${t.note ? ` (${t.note})` : ""}`);
  const price = f.listed_price ?? f.expected_sale_price;

  const input = {
    "Nom / modèle": f.name,
    "Type de pièce": itemTypeLabel(f.item_type),
    Catégorie: f.category ? CATEGORY_LABELS[f.category as Category] : null,
    Marque: f.brand_name,
    Modèle: f.model,
    Quantité: f.quantity && f.quantity > 1 ? `${f.quantity} pièces identiques vendues ensemble` : null,
    Designer: f.designer,
    "Année de fabrication": f.manufacture_year,
    Dimensions: dims,
    "Matières / couleur": f.materials,
    État: f.condition ? CONDITION_LABELS[f.condition as Condition] : null,
    "Note d'état donnée par le vendeur": f.condition_score !== null ? `${f.condition_score} / 10` : null,
    "Détails sur l'état": f.defects,
    "Description du vendeur": f.description,
    "Notes internes": (notes ?? []).map((n) => n.body).filter(Boolean).join(" / ") || null,
    "Travaux effectués": works.length ? [...new Set(works)].join(", ") : null,
    "Certificat d'authenticité": certificates ? "fourni par le vendeur" : null,
    "Prix affiché (€ TTC)": price,
  };

  try {
    const out = await generateListing(input, parsed.data.instruction);
    const stored = toStoredListings(out, price !== null ? String(price) : "");
    const patch: { listing_site?: typeof stored.site; listing_lbc?: typeof stored.lbc } = {};
    if (parsed.data.target !== "lbc") patch.listing_site = stored.site;
    if (parsed.data.target !== "site") patch.listing_lbc = stored.lbc;
    await supabase.from("furnitures").update(patch).eq("id", id);
    await supabase.from("activity_log").insert({
      furniture_id: id,
      kind: "ai_generation",
      label: `Textes de mise en ligne générés (${parsed.data.target === "both" ? "site + Leboncoin" : parsed.data.target === "site" ? "site" : "Leboncoin"})${parsed.data.instruction ? ` — consigne : « ${parsed.data.instruction} »` : ""}`,
    });
    return NextResponse.json(patch);
  } catch (error) {
    const message = error instanceof ListingError ? error.message : "Erreur inattendue pendant la génération.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
