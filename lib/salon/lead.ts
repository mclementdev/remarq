import { z } from "zod";
import { TZDate } from "@date-fns/tz";
import { SALON_SOURCES } from "@/lib/content/salon";

/**
 * Validation d'un lead de la landing. La date de rappel arrive au format
 * <input type="datetime-local"> (heure de Paris, sans fuseau).
 */
export const leadSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide.").max(254)),
  remindAt: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Date de rappel invalide."),
  consent: z.literal(true, { error: "Merci d'accepter l'utilisation de votre e-mail." }),
  source: z.enum(SALON_SOURCES).catch("stand"),
  /** Champ piège : invisible pour un humain, rempli par les robots. */
  website: z.string().optional(),
});

export type LeadInput = z.input<typeof leadSchema>;

export type ParsedLead =
  | { ok: true; spam: boolean; email: string; remindAt: Date | null; source: (typeof SALON_SOURCES)[number] }
  | { ok: false; error: string; field?: string };

/** Heure de Paris (« 2026-11-10T09:30 ») → instant. */
export function parisLocalToDate(local: string) {
  return new Date(new TZDate(`${local}:00`, "Europe/Paris").getTime());
}

export function parseLead(input: unknown, now: Date = new Date()): ParsedLead {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Saisie invalide.", field: String(issue?.path[0] ?? "") };
  }
  const d = parsed.data;
  let remindAt: Date | null = null;
  if (d.remindAt) {
    remindAt = parisLocalToDate(d.remindAt);
    if (Number.isNaN(remindAt.getTime())) return { ok: false, error: "Date de rappel invalide.", field: "remindAt" };
    if (remindAt.getTime() < now.getTime()) return { ok: false, error: "Choisissez une date de rappel à venir.", field: "remindAt" };
    if (remindAt.getTime() > now.getTime() + 366 * 86_400_000) return { ok: false, error: "Choisissez une date dans l'année qui vient.", field: "remindAt" };
  }
  return { ok: true, spam: !!d.website?.trim(), email: d.email, remindAt, source: d.source };
}
