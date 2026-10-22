"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { isStatus, STATUS_SHORT_LABELS, type FurnitureStatus } from "@/lib/status";
import { parseTransition } from "@/lib/transitions";
import { EMAIL_TEMPLATES, EMAIL_TEMPLATE_KEYS } from "@/lib/emails/templates";
import { APPOINTMENT_TYPE_LABELS, PERIOD_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export type StatusResult = { ok: true } | { ok: false; error: string };

function revalidateFurniture(id: string) {
  revalidatePath(`/meubles/${id}`);
  revalidatePath("/meubles");
  revalidatePath("/crm");
  revalidatePath("/");
}

/** Change le statut d'un meuble avec les informations demandées par la transition. */
export async function changeStatus(furnitureId: string, to: string, values: Record<string, string>): Promise<StatusResult> {
  if (!z.uuid().safeParse(furnitureId).success || !isStatus(to)) return { ok: false, error: "Requête invalide." };
  const { supabase } = await requireUser();

  const { data: current } = await supabase.from("furnitures").select("status").eq("id", furnitureId).single();
  if (!current) return { ok: false, error: "Meuble introuvable." };
  const from = current.status as FurnitureStatus;
  if (from === to) return { ok: false, error: `Le meuble est déjà au statut « ${STATUS_SHORT_LABELS[to]} ».` };

  const parsed = parseTransition(to, from, values ?? {});
  if (!parsed.ok) return parsed;
  const { fields, appointment } = parsed.payload;

  const { error } = await supabase.rpc("change_status", {
    p_furniture_id: furnitureId,
    p_to: to,
    p_fields: fields,
    p_history_extra: appointment ? { pickup_date: appointment.appointment_date, pickup_period: appointment.period } : {},
  });
  if (error) return { ok: false, error: "Changement de statut impossible : " + error.message };

  if (appointment) {
    const { error: apptError } = await supabase.from("appointments").insert({ furniture_id: furnitureId, ...appointment });
    if (apptError) return { ok: false, error: "Statut modifié, mais le rendez-vous n'a pas pu être créé." };
    await supabase.from("activity_log").insert({
      furniture_id: furnitureId,
      kind: "appointment",
      label: `Rendez-vous ajouté : ${APPOINTMENT_TYPE_LABELS[appointment.type]} le ${formatDate(appointment.appointment_date)} (${PERIOD_LABELS[appointment.period].toLowerCase()})`,
    });
  }

  revalidateFurniture(furnitureId);
  return { ok: true };
}

/** Journalise la préparation (ouverture) ou la copie d'un e-mail. */
export async function logEmail(furnitureId: string, templateKey: string, action: "prepared" | "copied"): Promise<void> {
  if (!z.uuid().safeParse(furnitureId).success) return;
  if (!(EMAIL_TEMPLATE_KEYS as readonly string[]).includes(templateKey)) return;
  const { supabase } = await requireUser();
  const name = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES].name;
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "email_prepared",
    label: action === "prepared" ? `Mail « ${name} » préparé` : `Mail « ${name} » copié`,
    payload: { template: templateKey, action },
  });
  revalidatePath(`/meubles/${furnitureId}`);
}
