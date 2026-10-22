"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { formatEuro, formatHours } from "@/lib/format";
import { MODE_LONG_LABELS, TIME_TYPE_LABELS } from "@/lib/labels";

export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): ActionResult => ({ ok: false, error });

function revalidate(id: string) {
  revalidatePath(`/meubles/${id}`);
  revalidatePath("/meubles");
  revalidatePath("/crm");
  revalidatePath("/");
}

const amount = z.number({ error: "Montant invalide." }).min(-10_000_000).max(10_000_000);
const optAmount = z.number({ error: "Montant invalide." }).nonnegative("Montant invalide.").max(10_000_000).nullable();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

// ---------------------------------------------------------------------------
// Champs financiers de base
// ---------------------------------------------------------------------------
const financeSchema = z.object({
  mode: z.enum(["buyout", "consignment"]).nullable(),
  offer_buyout_price: optAmount,
  expected_sale_price: optAmount,
  transport_cost: optAmount,
  final_buyout_price: optAmount,
  consignment_commission: optAmount,
  consignment_terms: z.string().trim().max(5000).nullable().transform((v) => v || null),
  listed_price: optAmount,
  final_sale_price: optAmount,
});

const FINANCE_LABELS: Record<string, string> = {
  mode: "Mode",
  offer_buyout_price: "Prix de rachat proposé",
  expected_sale_price: "Prix de vente espéré",
  transport_cost: "Coût de transport",
  final_buyout_price: "Prix de rachat final",
  consignment_commission: "Commission dépôt-vente",
  consignment_terms: "Conditions dépôt-vente",
  listed_price: "Prix affiché",
  final_sale_price: "Prix de vente final",
};

export async function updateFinances(furnitureId: string, input: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return fail("Requête invalide.");
  const parsed = financeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const { supabase } = await requireUser();
  const { data: before } = await supabase.from("furnitures").select("*").eq("id", furnitureId).single();
  if (!before) return fail("Meuble introuvable.");

  const changes = Object.entries(parsed.data).filter(([k, v]) => {
    const old = (before as Record<string, unknown>)[k];
    return (old === null ? null : String(old)) !== (v === null ? null : String(v));
  });
  if (!changes.length) return { ok: true };

  const { error } = await supabase.from("furnitures").update(parsed.data).eq("id", furnitureId);
  if (error) return fail("Enregistrement impossible.");

  const describe = (k: string, v: unknown) =>
    k === "mode" ? (v ? MODE_LONG_LABELS[v as "buyout"] : "non défini") : k === "consignment_terms" ? "modifiées" : formatEuro(v as number);
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "finance",
    label: `Finances modifiées : ${changes.map(([k, v]) => `${FINANCE_LABELS[k]} → ${describe(k, v)}`).join(" ; ")}`,
  });
  revalidate(furnitureId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Lignes d'ajustement (montant signé : dépense < 0)
// ---------------------------------------------------------------------------
const lineSchema = z.object({
  label: z.string().trim().min(1, "Indiquez un libellé.").max(200),
  amount: amount.refine((v) => v !== 0, "Le montant ne peut pas être nul."),
  category: z.enum(["extra_cost", "adjustment", "other"]),
  line_date: day,
});

export async function addFinanceLine(furnitureId: string, input: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return fail("Requête invalide.");
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("finance_lines").insert({ furniture_id: furnitureId, ...parsed.data });
  if (error) return fail("Enregistrement impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "finance",
    label: `Ligne ajoutée : ${parsed.data.label} (${formatEuro(parsed.data.amount, { cents: true, signed: true })})`,
  });
  revalidate(furnitureId);
  return { ok: true };
}

export async function deleteFinanceLine(lineId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(lineId).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { data: line } = await supabase.from("finance_lines").select("*").eq("id", lineId).single();
  if (!line) return fail("Ligne introuvable.");
  const { error } = await supabase.from("finance_lines").delete().eq("id", lineId);
  if (error) return fail("Suppression impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: line.furniture_id,
    kind: "finance",
    label: `Ligne supprimée : ${line.label} (${formatEuro(line.amount, { cents: true, signed: true })})`,
  });
  revalidate(line.furniture_id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Temps passé (pas de 0,25 h)
// ---------------------------------------------------------------------------
const timeSchema = z.object({
  type: z.enum(["cleaning", "repair", "photos", "other"]),
  hours: z
    .number({ error: "Durée invalide." })
    .positive("La durée doit être positive.")
    .max(100)
    .refine((h) => Number.isInteger(h * 4), "Saisissez des quarts d'heure (pas de 0,25 h)."),
  entry_date: day,
  note: z.string().trim().max(500).nullish().transform((v) => v || null),
});

export async function addTimeEntry(furnitureId: string, input: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return fail("Requête invalide.");
  const parsed = timeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("time_entries").insert({ furniture_id: furnitureId, ...parsed.data });
  if (error) return fail("Enregistrement impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "time",
    label: `Temps ajouté : +${formatHours(parsed.data.hours)} ${TIME_TYPE_LABELS[parsed.data.type].toLowerCase()}`,
  });
  revalidate(furnitureId);
  return { ok: true };
}

export async function deleteTimeEntry(entryId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(entryId).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { data: entry } = await supabase.from("time_entries").select("*").eq("id", entryId).single();
  if (!entry) return fail("Saisie introuvable.");
  const { error } = await supabase.from("time_entries").delete().eq("id", entryId);
  if (error) return fail("Suppression impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: entry.furniture_id,
    kind: "time",
    label: `Temps supprimé : ${formatHours(Number(entry.hours))} ${TIME_TYPE_LABELS[entry.type].toLowerCase()}`,
  });
  revalidate(entry.furniture_id);
  return { ok: true };
}
