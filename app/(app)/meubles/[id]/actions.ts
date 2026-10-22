"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/storage";
import type { FurnitureUpdate } from "@/lib/types";
import type { Json } from "@/lib/database.types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const optText = z.string().trim().max(5000).nullish().transform((v) => (v ? v : null));
const optNum = z.number().nonnegative().max(10_000_000).nullish().transform((v) => v ?? null);

function revalidate(id: string) {
  revalidatePath(`/meubles/${id}`);
  revalidatePath("/meubles");
  revalidatePath("/crm");
}

// ---------------------------------------------------------------------------
// Informations du meuble
// ---------------------------------------------------------------------------
const infoSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(200),
  category: z.enum(["seating", "storage", "tables_desks", "lighting_decor"]),
  brand_id: z.uuid().nullish().transform((v) => v ?? null),
  brand_other: optText,
  designer: optText,
  manufacture_year: optText,
  description: z.string().trim().min(1, "La description est obligatoire.").max(5000),
  width_cm: optNum,
  depth_cm: optNum,
  height_cm: optNum,
  materials: optText,
  condition: z.enum(["new", "very_good", "good", "used", "to_restore"]),
  defects: optText,
  purchase_year: optText,
  original_price: optNum,
  desired_price: optNum,
});

const INFO_LABELS: Record<string, string> = {
  name: "nom",
  category: "catégorie",
  brand_id: "marque",
  brand_other: "marque",
  designer: "designer",
  manufacture_year: "année de fabrication",
  description: "description",
  width_cm: "dimensions",
  depth_cm: "dimensions",
  height_cm: "dimensions",
  materials: "matières",
  condition: "état",
  defects: "défauts",
  purchase_year: "année d'achat",
  original_price: "prix d'origine",
  desired_price: "prix souhaité",
};

const sellerSchema = z.object({
  seller_first_name: z.string().trim().min(1, "Prénom obligatoire.").max(100),
  seller_last_name: z.string().trim().min(1, "Nom obligatoire.").max(100),
  seller_email: z.email("E-mail invalide."),
  seller_phone: z.string().trim().min(6, "Téléphone invalide.").max(30),
  seller_street: z.string().trim().min(1, "Adresse obligatoire.").max(300),
  seller_postal_code: z.string().trim().min(4, "Code postal invalide.").max(10),
  seller_city: z.string().trim().min(1, "Ville obligatoire.").max(120),
  floor: z.enum(["ground", "1", "2", "3", "4_plus"]).nullish().transform((v) => v ?? null),
  has_elevator: z.boolean().nullish().transform((v) => v ?? null),
  access_notes: optText,
});

const SELLER_LABELS: Record<string, string> = {
  seller_first_name: "prénom",
  seller_last_name: "nom",
  seller_email: "e-mail",
  seller_phone: "téléphone",
  seller_street: "adresse",
  seller_postal_code: "adresse",
  seller_city: "adresse",
  floor: "étage",
  has_elevator: "ascenseur",
  access_notes: "précisions d'accès",
};

async function updateWithLog(
  id: string,
  patch: FurnitureUpdate,
  labels: Record<string, string>,
  prefix: string,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: before } = await supabase.from("furnitures").select("*").eq("id", id).single();
  if (!before) return fail("Meuble introuvable.");

  const changed = Object.entries(patch).filter(([k, v]) => {
    const old = (before as Record<string, unknown>)[k];
    return String(old ?? "") !== String(v ?? "");
  });
  if (!changed.length) return { ok: true };

  const { error } = await supabase.from("furnitures").update(patch).eq("id", id);
  if (error) return fail("Enregistrement impossible : " + error.message);

  const fields = [...new Set(changed.map(([k]) => labels[k] ?? k))];
  await supabase.from("activity_log").insert({
    furniture_id: id,
    kind: "field_update",
    label: `${prefix} : ${fields.join(", ")}`,
    payload: JSON.parse(
      JSON.stringify(Object.fromEntries(changed.map(([k, v]) => [k, { avant: (before as Record<string, unknown>)[k] ?? null, apres: v ?? null }]))),
    ) as { [key: string]: Json },
  });
  revalidate(id);
  return { ok: true };
}

export async function updateFurnitureInfo(id: string, input: unknown): Promise<ActionResult> {
  const parsed = infoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const d = parsed.data;
  if (!d.brand_id && !d.brand_other) return fail("Choisissez une marque ou précisez-la.");
  return updateWithLog(id, { ...d, brand_other: d.brand_id ? null : d.brand_other }, INFO_LABELS, "Informations modifiées");
}

export async function updateSeller(id: string, input: unknown): Promise<ActionResult> {
  const parsed = sellerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  return updateWithLog(id, { ...parsed.data, seller_email: parsed.data.seller_email.toLowerCase() }, SELLER_LABELS, "Vendeur modifié");
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------
const photoKind = z.enum(["deposit", "certificate", "conformity", "listing"]);
const KIND_LABELS = { deposit: "du meuble", certificate: "de certificat", conformity: "de conformité", listing: "de mise en ligne" } as const;

export async function registerPhotos(
  furnitureId: string,
  kind: z.infer<typeof photoKind>,
  files: { path: string; thumbPath: string }[],
): Promise<ActionResult> {
  const k = photoKind.safeParse(kind);
  if (!k.success || !files.length) return fail("Requête invalide.");
  const prefix = `meubles/${furnitureId}/`;
  if (files.some((f) => !f.path.startsWith(prefix) || !f.thumbPath.startsWith(prefix))) return fail("Chemin invalide.");

  const { supabase } = await requireUser();
  const { data: last } = await supabase
    .from("photos")
    .select("position, is_main")
    .eq("furniture_id", furnitureId)
    .eq("kind", kind)
    .order("position", { ascending: false });
  const start = (last?.[0]?.position ?? -1) + 1;
  const hasMain = last?.some((p) => p.is_main);

  const { error } = await supabase.from("photos").insert(
    files.map((f, i) => ({
      furniture_id: furnitureId,
      kind,
      slot: "other" as const,
      position: start + i,
      is_main: kind === "deposit" && !hasMain && i === 0,
      storage_path: f.path,
      thumb_path: f.thumbPath,
    })),
  );
  if (error) return fail("Enregistrement des photos impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "photo",
    label: `${files.length} photo${files.length > 1 ? "s" : ""} ${KIND_LABELS[kind]} ajoutée${files.length > 1 ? "s" : ""}`,
  });
  revalidate(furnitureId);
  return { ok: true };
}

export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: photo } = await supabase.from("photos").select("*").eq("id", photoId).single();
  if (!photo || !photo.furniture_id) return fail("Photo introuvable.");

  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) return fail("Suppression impossible.");
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path, photo.thumb_path].filter((p): p is string => !!p));

  if (photo.is_main) {
    const { data: next } = await supabase
      .from("photos")
      .select("id")
      .eq("furniture_id", photo.furniture_id)
      .eq("kind", photo.kind)
      .order("position")
      .limit(1);
    if (next?.[0]) await supabase.from("photos").update({ is_main: true }).eq("id", next[0].id);
  }
  await supabase.from("activity_log").insert({
    furniture_id: photo.furniture_id,
    kind: "photo",
    label: `Photo ${KIND_LABELS[photo.kind]} supprimée`,
  });
  revalidate(photo.furniture_id);
  return { ok: true };
}

export async function setMainPhoto(photoId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: photo } = await supabase.from("photos").select("furniture_id, kind").eq("id", photoId).single();
  if (!photo?.furniture_id) return fail("Photo introuvable.");
  await supabase.from("photos").update({ is_main: false }).eq("furniture_id", photo.furniture_id).eq("kind", photo.kind);
  const { error } = await supabase.from("photos").update({ is_main: true }).eq("id", photoId);
  if (error) return fail("Modification impossible.");
  revalidate(photo.furniture_id);
  return { ok: true };
}

export async function reorderPhotos(furnitureId: string, orderedIds: string[]): Promise<ActionResult> {
  const ids = z.array(z.uuid()).max(100).safeParse(orderedIds);
  if (!ids.success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const results = await Promise.all(
    ids.data.map((id, position) => supabase.from("photos").update({ position }).eq("id", id).eq("furniture_id", furnitureId)),
  );
  if (results.some((r) => r.error)) return fail("Réorganisation impossible.");
  revalidate(furnitureId);
  return { ok: true };
}
