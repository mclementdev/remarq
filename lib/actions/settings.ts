"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { scaleSchema } from "@/lib/depot/scale";

export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): ActionResult => ({ ok: false, error });

function revalidateAll() {
  revalidatePath("/", "layout");
}

const brandName = z.string().trim().min(1, "Nom de marque obligatoire.").max(120);

export async function addBrand(name: string): Promise<ActionResult> {
  const parsed = brandName.safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { supabase } = await requireUser();
  const { error } = await supabase.from("brands").insert({ name: parsed.data });
  if (error) return fail(error.code === "23505" ? "Cette marque existe déjà." : "Ajout impossible.");
  revalidateAll();
  return { ok: true };
}

export async function renameBrand(id: string, name: string): Promise<ActionResult> {
  const parsed = brandName.safeParse(name);
  if (!z.uuid().safeParse(id).success || !parsed.success) return fail(parsed.error?.issues[0].message ?? "Requête invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("brands").update({ name: parsed.data }).eq("id", id);
  if (error) return fail(error.code === "23505" ? "Cette marque existe déjà." : "Renommage impossible.");
  revalidateAll();
  return { ok: true };
}

export async function setBrandActive(id: string, active: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("brands").update({ active }).eq("id", id);
  if (error) return fail("Modification impossible.");
  revalidateAll();
  return { ok: true };
}

/** Supprime une marque inutilisée ; une marque déjà liée à des meubles doit être désactivée. */
export async function deleteBrand(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { count } = await supabase.from("furnitures").select("id", { count: "exact", head: true }).eq("brand_id", id);
  if (count) return fail(`Marque utilisée par ${count} meuble${count > 1 ? "s" : ""} : désactivez-la plutôt (elle disparaîtra du formulaire).`);
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return fail("Suppression impossible.");
  revalidateAll();
  return { ok: true };
}

/** « Ajouter à la liste » : crée (ou réutilise) la marque et rattache les meubles saisis avec ce libellé. */
export async function acceptSuggestion(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { data: s } = await supabase.from("brand_suggestions").select("*").eq("id", id).single();
  if (!s) return fail("Suggestion introuvable.");

  const label = s.label.trim();
  const { data: existing } = await supabase.from("brands").select("id").ilike("name", label).maybeSingle();
  let brandId = existing?.id;
  if (!brandId) {
    const { data: created, error } = await supabase.from("brands").insert({ name: label }).select("id").single();
    if (error || !created) return fail("Ajout impossible.");
    brandId = created.id;
  }
  await supabase.from("furnitures").update({ brand_id: brandId, brand_other: null }).is("brand_id", null).ilike("brand_other", label);
  await supabase.from("brand_suggestions").update({ status: "added" }).ilike("label", label).eq("status", "pending");
  revalidateAll();
  return { ok: true };
}

export async function dismissSuggestion(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("brand_suggestions").update({ status: "dismissed" }).eq("id", id);
  if (error) return fail("Modification impossible.");
  revalidateAll();
  return { ok: true };
}

const settingsSchema = z.object({
  shop_name: z.string().trim().min(1, "Nom de la boutique obligatoire.").max(100),
  email_signature: z.string().trim().min(1, "Signature obligatoire.").max(1000),
  workshop_address: z.string().trim().max(300),
  offer_validity_days: z.number().int("Nombre de jours entier.").min(1).max(365),
  hourly_rate: z.number().min(0, "Taux horaire invalide.").max(1000),
  non_conform_delay_days: z.number().int("Nombre de jours entier.").min(1).max(365),
});

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const { supabase } = await requireUser();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("settings")
    .upsert(Object.entries(parsed.data).map(([key, value]) => ({ key, value, updated_at: now })));
  if (error) return fail("Enregistrement impossible.");
  revalidateAll();
  return { ok: true };
}

/** Barème de partage affiché sur le formulaire public. */
export async function updateConsignmentScale(input: unknown): Promise<ActionResult> {
  const parsed = scaleSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Barème invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "consignment_scale", value: parsed.data, updated_at: new Date().toISOString() });
  if (error) return fail("Enregistrement impossible.");
  revalidatePath("/depot");
  revalidatePath("/salon");
  return { ok: true };
}
