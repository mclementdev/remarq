import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CERTIFICATION_TEXT, depotSchema } from "@/lib/validation/depot";
import { CONTACT_CONSENT_TEXT } from "@/lib/content/depot";
import { ITEM_TYPES } from "@/lib/depot/item-types";
import { conditionFromScore } from "@/lib/depot/condition";
import { composeName } from "@/lib/depot/name";

const BUCKET = "furniture-photos";
const SAVE_ERROR = "Votre demande n'a pas pu être enregistrée. Réessayez dans un instant.";

export async function POST(request: Request) {
  const parsed = depotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Certaines informations sont manquantes ou invalides.", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  const { submissionId, source, seller, pieces, pickup } = parsed.data;
  const supabase = createAdminClient();
  const folder = `depot/${submissionId}`;

  // Les fichiers référencés doivent appartenir à cette demande et exister réellement.
  const { data: objects, error: listError } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
  if (listError) return NextResponse.json({ error: "Stockage indisponible, réessayez." }, { status: 500 });
  const existing = new Set((objects ?? []).map((o) => `${folder}/${o.name}`));
  const missing = pieces.some((p) => p.photos.some((ph) => !existing.has(ph.path) || !existing.has(ph.thumbPath)));
  if (missing) {
    return NextResponse.json({ error: "Une photo n'a pas été envoyée correctement. Réessayez de l'ajouter." }, { status: 400 });
  }

  const { count } = await supabase.from("furnitures").select("id", { count: "exact", head: true }).eq("submission_id", submissionId);
  if (count) return NextResponse.json({ error: "Cette demande a déjà été envoyée." }, { status: 409 });

  // Marque saisie librement : rattachée à la liste si elle y figure (casse ignorée).
  const { data: brands } = await supabase.from("brands").select("id, name").eq("active", true);
  const knownBrands = new Map((brands ?? []).map((b) => [b.name.trim().toLowerCase(), b]));

  const now = new Date().toISOString();
  const rows = pieces.map((p, i) => {
    const known = knownBrands.get(p.brand.toLowerCase());
    const brandId = known?.id ?? null;
    return {
      submission_id: submissionId,
      item_index: i + 1,
      source,
      name: composeName({ itemType: p.itemType, brand: known?.name ?? p.brand, model: p.model }),
      item_type: p.itemType,
      category: ITEM_TYPES[p.itemType].category,
      brand_id: brandId,
      brand_other: brandId ? null : p.brand,
      model: p.model,
      quantity: p.quantity,
      description: p.description,
      condition_score: p.conditionScore,
      condition: conditionFromScore(p.conditionScore),
      defects: p.conditionDetails,
      purchase_year: p.purchaseYear,
      original_price: p.originalPrice,
      floor: pickup.floor,
      has_elevator: pickup.hasElevator,
      access_notes: pickup.accessNotes,
      seller_first_name: seller.firstName,
      seller_last_name: seller.lastName,
      seller_email: seller.email,
      seller_phone: seller.phone,
      seller_street: pickup.street,
      seller_postal_code: pickup.postalCode,
      seller_city: pickup.city,
      contact_consent_at: now,
      contact_consent_text: CONTACT_CONSENT_TEXT,
      certified_at: now,
      certification_text: CERTIFICATION_TEXT,
      status: "new" as const,
    };
  });

  const { data: inserted, error: insertError } = await supabase.from("furnitures").insert(rows).select("id, item_index, brand_other");
  if (insertError || !inserted || inserted.length !== pieces.length) {
    return NextResponse.json({ error: SAVE_ERROR }, { status: 500 });
  }
  const idByIndex = new Map(inserted.map((f) => [f.item_index, f.id]));

  const photoRows = pieces.flatMap((p, i) =>
    p.photos.map((ph, position) => ({
      furniture_id: idByIndex.get(i + 1)!,
      submission_id: submissionId,
      kind: "deposit" as const,
      slot: ph.slot,
      position,
      is_main: position === 0,
      storage_path: ph.path,
      thumb_path: ph.thumbPath,
    })),
  );
  const historyRows = inserted.map((f) => ({ furniture_id: f.id, from_status: null, to_status: "new" as const, payload: { source: "formulaire" } }));
  const suggestionRows = inserted
    .filter((f) => f.brand_other && f.brand_other.trim().toLowerCase() !== "inconnu")
    .map((f) => ({ label: f.brand_other!, furniture_id: f.id }));

  const [photosRes, historyRes, suggestionRes] = await Promise.all([
    supabase.from("photos").insert(photoRows),
    supabase.from("status_history").insert(historyRows),
    suggestionRows.length ? supabase.from("brand_suggestions").insert(suggestionRows) : Promise.resolve({ error: null }),
  ]);

  if (photosRes.error || historyRes.error || suggestionRes.error) {
    await supabase.from("furnitures").delete().eq("submission_id", submissionId);
    return NextResponse.json({ error: SAVE_ERROR }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: inserted.length });
}
