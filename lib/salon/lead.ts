import { z } from "zod";
import { SALON_SOURCES } from "@/lib/content/salon";

/** Validation d'un lead de la landing (e-mail + consentement). */
export const leadSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide.").max(254)),
  consent: z.literal(true, { error: "Merci d'accepter l'utilisation de votre e-mail." }),
  source: z.enum(SALON_SOURCES).catch("stand"),
  /** Champ piège : invisible pour un humain, rempli par les robots. */
  website: z.string().optional(),
});

export type LeadInput = z.input<typeof leadSchema>;

export type ParsedLead =
  | { ok: true; spam: boolean; email: string; source: (typeof SALON_SOURCES)[number] }
  | { ok: false; error: string; field?: string };

export function parseLead(input: unknown): ParsedLead {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Saisie invalide.", field: String(issue?.path[0] ?? "") };
  }
  const d = parsed.data;
  return { ok: true, spam: !!d.website?.trim(), email: d.email, source: d.source };
}
