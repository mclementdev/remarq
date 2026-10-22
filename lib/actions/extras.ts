"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { ATTACHMENT_BUCKET } from "@/lib/storage";
import { APPOINTMENT_TYPE_LABELS, PERIOD_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): ActionResult => ({ ok: false, error });

function revalidate(id: string) {
  revalidatePath(`/meubles/${id}`);
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Notes internes et pièces jointes
// ---------------------------------------------------------------------------
const attachmentSchema = z.object({
  path: z.string().min(1).max(400),
  filename: z.string().min(1).max(255),
  mime: z.string().max(120).nullish(),
  size: z.number().int().nonnegative().nullish(),
});

export async function addNote(
  furnitureId: string,
  body: string,
  attachments: z.input<typeof attachmentSchema>[] = [],
): Promise<ActionResult> {
  const id = z.uuid().safeParse(furnitureId);
  const files = z.array(attachmentSchema).max(20).safeParse(attachments);
  const text = body.trim();
  if (!id.success || !files.success) return fail("Requête invalide.");
  if (!text && !files.data.length) return fail("Écrivez une note ou joignez un fichier.");
  if (files.data.some((f) => !f.path.startsWith(`meubles/${furnitureId}/`))) return fail("Chemin invalide.");

  const { supabase } = await requireUser();
  const { data: note, error } = await supabase
    .from("notes")
    .insert({ furniture_id: furnitureId, body: text })
    .select("id")
    .single();
  if (error || !note) return fail("Enregistrement de la note impossible.");

  if (files.data.length) {
    const { error: attError } = await supabase.from("attachments").insert(
      files.data.map((f) => ({
        furniture_id: furnitureId,
        note_id: note.id,
        storage_path: f.path,
        filename: f.filename,
        mime: f.mime ?? null,
        size_bytes: f.size ?? null,
      })),
    );
    if (attError) return fail("Note enregistrée, mais les pièces jointes n'ont pas pu être rattachées.");
  }

  const excerpt = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "note",
    label: [excerpt ? `Note : « ${excerpt} »` : "Pièce jointe ajoutée", files.data.length ? `(${files.data.length} pièce${files.data.length > 1 ? "s" : ""} jointe${files.data.length > 1 ? "s" : ""})` : ""]
      .filter(Boolean)
      .join(" "),
  });
  revalidate(furnitureId);
  return { ok: true };
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(attachmentId).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { data: att } = await supabase.from("attachments").select("*").eq("id", attachmentId).single();
  if (!att) return fail("Pièce jointe introuvable.");
  const { error } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (error) return fail("Suppression impossible.");
  await supabase.storage.from(ATTACHMENT_BUCKET).remove([att.storage_path]);
  await supabase.from("activity_log").insert({ furniture_id: att.furniture_id, kind: "note", label: `Pièce jointe supprimée : ${att.filename}` });
  revalidate(att.furniture_id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Calendrier
// ---------------------------------------------------------------------------
const appointmentSchema = z.object({
  type: z.enum(["seller_pickup", "buyer_pickup", "client_return"], { error: "Choisissez le type de rendez-vous." }),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  period: z.enum(["morning", "afternoon"], { error: "Choisissez Matin ou Après-midi." }),
  note: z.string().trim().max(1000).nullish().transform((v) => v || null),
});

export async function addAppointment(furnitureId: string, input: unknown): Promise<ActionResult> {
  if (!z.uuid().safeParse(furnitureId).success) return fail("Requête invalide.");
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Saisie invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("appointments").insert({ furniture_id: furnitureId, ...parsed.data });
  if (error) return fail("Enregistrement impossible.");
  const a = parsed.data;
  await supabase.from("activity_log").insert({
    furniture_id: furnitureId,
    kind: "appointment",
    label: `Rendez-vous ajouté : ${APPOINTMENT_TYPE_LABELS[a.type]} le ${formatDate(a.appointment_date)} (${PERIOD_LABELS[a.period].toLowerCase()})`,
  });
  revalidate(furnitureId);
  return { ok: true };
}

export async function setAppointmentDone(appointmentId: string, done: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(appointmentId).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { data: a, error } = await supabase.from("appointments").update({ done }).eq("id", appointmentId).select("*").single();
  if (error || !a) return fail("Modification impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: a.furniture_id,
    kind: "appointment",
    label: `Rendez-vous ${done ? "effectué" : "remis à faire"} : ${APPOINTMENT_TYPE_LABELS[a.type]} du ${formatDate(a.appointment_date)}`,
  });
  revalidate(a.furniture_id);
  return { ok: true };
}

export async function deleteAppointment(appointmentId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(appointmentId).success) return fail("Requête invalide.");
  const { supabase } = await requireUser();
  const { data: a } = await supabase.from("appointments").select("*").eq("id", appointmentId).single();
  if (!a) return fail("Rendez-vous introuvable.");
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);
  if (error) return fail("Suppression impossible.");
  await supabase.from("activity_log").insert({
    furniture_id: a.furniture_id,
    kind: "appointment",
    label: `Rendez-vous supprimé : ${APPOINTMENT_TYPE_LABELS[a.type]} du ${formatDate(a.appointment_date)}`,
  });
  revalidate(a.furniture_id);
  return { ok: true };
}
