import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CERTIFICATION_TEXT, depotSchema } from "@/lib/validation/depot";

const BUCKET = "furniture-photos";

export async function POST(request: Request) {
  const parsed = depotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Certaines informations sont manquantes ou invalides.", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const supabase = createAdminClient();
  const folder = `depot/${d.submissionId}`;

  // Les fichiers référencés doivent appartenir à ce dépôt et exister réellement.
  const { data: objects, error: listError } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
  if (listError) return NextResponse.json({ error: "Stockage indisponible, réessayez." }, { status: 500 });
  const existing = new Set((objects ?? []).map((o) => `${folder}/${o.name}`));
  const allFiles = [...d.photos, ...d.certificates];
  const missing = allFiles.some((p) => !existing.has(p.path) || !existing.has(p.thumbPath));
  if (missing) {
    return NextResponse.json({ error: "Une photo n'a pas été envoyée correctement. Réessayez de l'ajouter." }, { status: 400 });
  }

  const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("submission_id", d.submissionId);
  if (count) return NextResponse.json({ error: "Cette demande a déjà été envoyée." }, { status: 409 });

  // Marque : on vérifie que l'identifiant existe et est actif.
  let brandId: string | null = null;
  if (d.brandId) {
    const { data: brand } = await supabase.from("brands").select("id").eq("id", d.brandId).eq("active", true).maybeSingle();
    brandId = brand?.id ?? null;
  }
  const brandOther = brandId ? null : d.brandOther;
  if (!brandId && !brandOther) return NextResponse.json({ error: "Choisissez une marque ou précisez-la." }, { status: 400 });

  const { data: furniture, error: insertError } = await supabase
    .from("furnitures")
    .insert({
      name: d.name,
      category: d.category,
      brand_id: brandId,
      brand_other: brandOther,
      designer: d.designer,
      manufacture_year: d.manufactureYear,
      description: d.description,
      width_cm: d.widthCm,
      depth_cm: d.depthCm,
      height_cm: d.heightCm,
      materials: d.materials,
      condition: d.condition,
      defects: d.defects,
      purchase_year: d.purchaseYear,
      original_price: d.originalPrice,
      desired_price: d.desiredPrice,
      floor: d.floor,
      has_elevator: d.hasElevator,
      access_notes: d.accessNotes,
      seller_first_name: d.firstName,
      seller_last_name: d.lastName,
      seller_email: d.email.toLowerCase(),
      seller_phone: d.phone,
      seller_street: d.street,
      seller_postal_code: d.postalCode,
      seller_city: d.city,
      certified_at: new Date().toISOString(),
      certification_text: CERTIFICATION_TEXT,
      status: "new",
    })
    .select("id")
    .single();
  if (insertError || !furniture) {
    return NextResponse.json({ error: "Votre demande n'a pas pu être enregistrée. Réessayez dans un instant." }, { status: 500 });
  }

  const photoRows = [
    ...d.photos.map((p, i) => ({
      furniture_id: furniture.id,
      submission_id: d.submissionId,
      kind: "deposit" as const,
      slot: p.slot,
      position: i,
      is_main: i === 0,
      storage_path: p.path,
      thumb_path: p.thumbPath,
    })),
    ...d.certificates.map((p, i) => ({
      furniture_id: furniture.id,
      submission_id: d.submissionId,
      kind: "certificate" as const,
      slot: "other" as const,
      position: i,
      is_main: false,
      storage_path: p.path,
      thumb_path: p.thumbPath,
    })),
  ];

  const [photosRes, historyRes, suggestionRes] = await Promise.all([
    supabase.from("photos").insert(photoRows),
    supabase.from("status_history").insert({
      furniture_id: furniture.id,
      from_status: null,
      to_status: "new",
      payload: { source: "formulaire" },
    }),
    brandOther
      ? supabase.from("brand_suggestions").insert({ label: brandOther, furniture_id: furniture.id })
      : Promise.resolve({ error: null }),
  ]);

  if (photosRes.error || historyRes.error || suggestionRes.error) {
    await supabase.from("furnitures").delete().eq("id", furniture.id);
    return NextResponse.json({ error: "Votre demande n'a pas pu être enregistrée. Réessayez dans un instant." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
