"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const siteSchema = z.object({ title: z.string().max(300), body: z.string().max(20000), missing: z.array(z.string()).default([]), generatedAt: z.string().optional() });
const lbcSchema = z.object({ title: z.string().max(70, "Titre Leboncoin : 70 caractères maximum."), body: z.string().max(20000), category: z.string().max(100), price: z.string().max(20), keywords: z.string().max(500), generatedAt: z.string().optional() });

/** Enregistre les textes modifiés à la main. */
export async function saveListing(furnitureId: string, which: "site" | "lbc", data: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return { ok: false, error: "Requête invalide." };
  const parsed = (which === "site" ? siteSchema : lbcSchema).safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  const { supabase } = await requireUser();
  const value = { ...parsed.data, editedAt: new Date().toISOString() };
  const { error } = await supabase.from("furnitures").update(which === "site" ? { listing_site: value } : { listing_lbc: value }).eq("id", furnitureId);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  await supabase.from("activity_log").insert({ furniture_id: furnitureId, kind: "ai_generation", label: `Texte ${which === "site" ? "site" : "Leboncoin"} modifié à la main` });
  revalidatePath(`/meubles/${furnitureId}`);
  return { ok: true };
}

const publicationSchema = z.object({
  published_site: z.boolean(),
  published_site_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  published_lbc: z.boolean(),
  published_lbc_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function updatePublication(furnitureId: string, input: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return { ok: false, error: "Requête invalide." };
  const parsed = publicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Date de publication invalide." };
  const d = parsed.data;
  if ((d.published_site && !d.published_site_at) || (d.published_lbc && !d.published_lbc_at)) return { ok: false, error: "Indiquez la date de publication." };
  const patch = {
    published_site: d.published_site,
    published_site_at: d.published_site ? d.published_site_at : null,
    published_lbc: d.published_lbc,
    published_lbc_at: d.published_lbc ? d.published_lbc_at : null,
  };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("furnitures").update(patch).eq("id", furnitureId);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  const parts = [`site : ${patch.published_site ? `oui (${patch.published_site_at})` : "non"}`, `Leboncoin : ${patch.published_lbc ? `oui (${patch.published_lbc_at})` : "non"}`];
  await supabase.from("activity_log").insert({ furniture_id: furnitureId, kind: "field_update", label: `Publication mise à jour — ${parts.join(", ")}` });
  revalidatePath(`/meubles/${furnitureId}`);
  return { ok: true };
}

const conformitySchema = z.object({
  conformity_report: z.string().trim().max(5000).nullable().transform((v) => v || null),
  non_conform_choice: z.enum(["client_pickup", "carrier_return"]).nullable(),
  return_quote: z.number().nonnegative().max(1_000_000).nullable(),
});

export async function updateConformity(furnitureId: string, input: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return { ok: false, error: "Requête invalide." };
  const parsed = conformitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Saisie invalide." };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("furnitures").update(parsed.data).eq("id", furnitureId);
  if (error) return { ok: false, error: "Enregistrement impossible." };
  await supabase.from("activity_log").insert({ furniture_id: furnitureId, kind: "field_update", label: "Conformité mise à jour" });
  revalidatePath(`/meubles/${furnitureId}`);
  return { ok: true };
}
