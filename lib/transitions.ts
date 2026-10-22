/**
 * Informations demandées lors d'un changement de statut (§6, « Règles de transition »).
 * Partagé entre la fenêtre de saisie (rendu) et la Server Action (validation).
 */
import { z } from "zod";
import type { FurnitureStatus } from "@/lib/status";
import {
  MODE_LONG_LABELS,
  NON_CONFORM_CHOICE_LABELS,
  PERIOD_LABELS,
  REFUSAL_REASON_LABELS,
  SALE_CHANNEL_LABELS,
} from "@/lib/labels";
import type { EmailTemplateKey } from "@/lib/emails/templates";

export type FieldType = "money" | "date" | "text" | "textarea" | "select" | "radio" | "checkbox";

export type FieldSpec = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Record<string, string>;
  hint?: string;
  /** Champ affiché seulement si la condition est vraie. */
  showIf?: (values: Record<string, string>) => boolean;
};

/** Valeurs utilisées pour pré-remplir les fenêtres (fiche courante). */
export type TransitionContext = {
  from: FurnitureStatus;
  today: string;
  offer_buyout_price: number | null;
  expected_sale_price: number | null;
  transport_cost: number | null;
  consignment_terms: string | null;
  mode: "buyout" | "consignment" | null;
  final_buyout_price: number | null;
  received_at: string | null;
  conformity_report: string | null;
  non_conform_choice: string | null;
  return_quote: number | null;
  listed_price: number | null;
  published_site: boolean;
  published_site_at: string | null;
  published_lbc: boolean;
  published_lbc_at: string | null;
  final_sale_price: number | null;
  sale_channel: string | null;
  sold_at: string | null;
  refusal_reason: string | null;
  /** Délai de non-conformité dépassé (pour `preparing` depuis `non_conform`). */
  nonConformExpired: boolean;
};

export type TransitionSpec = {
  fields: FieldSpec[];
  /** Texte d'aide affiché en tête de fenêtre. */
  intro?: string;
  /** Modèle d'e-mail proposé après validation. */
  email?: (values: Record<string, string>, ctx: TransitionContext) => EmailTemplateKey | null;
  /** Modèle d'e-mail facultatif proposé (bouton secondaire). */
  optionalEmail?: (values: Record<string, string>, ctx: TransitionContext) => EmailTemplateKey | null;
  /** Ajoute une zone d'envoi de photos de conformité. */
  conformityPhotos?: boolean;
  defaults?: (ctx: TransitionContext) => Record<string, string>;
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export const TRANSITIONS: Partial<Record<FurnitureStatus, TransitionSpec>> = {
  info_requested: {
    fields: [],
    intro: "Le meuble passe en « Infos demandées ». Le mail de demande d'informations vous sera proposé.",
    email: () => "info_request",
  },
  refused: {
    fields: [{ name: "refusal_reason", label: "Motif du refus", type: "radio", required: true, options: REFUSAL_REASON_LABELS }],
    email: (v) => (v.refusal_reason ? (`refusal_${v.refusal_reason}` as EmailTemplateKey) : null),
    defaults: (c) => ({ refusal_reason: s(c.refusal_reason) }),
  },
  offer_sent: {
    fields: [
      { name: "offer_buyout_price", label: "Prix de rachat proposé (€ TTC)", type: "money", required: true },
      { name: "expected_sale_price", label: "Prix de vente espéré (€ TTC)", type: "money", required: true },
      { name: "transport_cost", label: "Coût de transport d'enlèvement (€ TTC)", type: "money", required: true, hint: "À la charge du vendeur, conservé pour mémoire." },
      { name: "consignment_terms", label: "Conditions dépôt-vente", type: "textarea", hint: "Commission, durée du mandat, refacturation du temps…" },
    ],
    email: () => "offer",
    defaults: (c) => ({
      offer_buyout_price: s(c.offer_buyout_price),
      expected_sale_price: s(c.expected_sale_price),
      transport_cost: s(c.transport_cost),
      consignment_terms: s(c.consignment_terms),
    }),
  },
  offer_accepted: {
    fields: [
      { name: "mode", label: "Mode choisi par le client", type: "radio", required: true, options: MODE_LONG_LABELS },
      { name: "final_buyout_price", label: "Prix de rachat final (€ TTC)", type: "money", required: true, showIf: (v) => v.mode === "buyout" },
    ],
    defaults: (c) => ({ mode: s(c.mode), final_buyout_price: s(c.final_buyout_price ?? c.offer_buyout_price) }),
  },
  pickup_scheduled: {
    fields: [
      { name: "pickup_date", label: "Date d'enlèvement", type: "date", required: true },
      { name: "pickup_period", label: "Créneau", type: "radio", required: true, options: PERIOD_LABELS },
      { name: "pickup_note", label: "Note (facultatif)", type: "text" },
    ],
    intro: "Le rendez-vous est ajouté au calendrier du meuble.",
    email: () => "pickup_confirmation",
  },
  received: {
    fields: [{ name: "received_at", label: "Date de réception", type: "date", required: true }],
    defaults: (c) => ({ received_at: c.received_at ?? c.today }),
  },
  non_conform: {
    fields: [
      { name: "conformity_report", label: "Constat", type: "textarea", required: true },
      { name: "non_conform_choice", label: "Choix du client", type: "radio", options: NON_CONFORM_CHOICE_LABELS, hint: "Peut être renseigné plus tard, quand le client aura répondu." },
      { name: "return_quote", label: "Devis retour transporteur (€ TTC)", type: "money", hint: "Utilisé dans le mail « Non conforme »." },
    ],
    intro: "Le compteur de non-conformité démarre aujourd'hui.",
    conformityPhotos: true,
    email: () => "non_conform",
    defaults: (c) => ({ conformity_report: s(c.conformity_report), non_conform_choice: s(c.non_conform_choice), return_quote: s(c.return_quote) }),
  },
  preparing: {
    fields: [
      {
        name: "abandoned",
        label: "Abandonné par le client (délai dépassé) : le meuble est conservé",
        type: "checkbox",
        showIf: (v) => v.__from === "non_conform",
      },
      {
        name: "final_buyout_price",
        label: "Prix d'achat (€ TTC)",
        type: "money",
        required: true,
        hint: "0 € par défaut pour un meuble abandonné ; le meuble passe en mode Rachat.",
        showIf: (v) => v.__from === "non_conform" && v.abandoned === "true",
      },
    ],
    optionalEmail: (_v, c) => (c.from === "received" ? "received_ok" : null),
    defaults: (c) => ({
      abandoned: c.from === "non_conform" && c.nonConformExpired ? "true" : "",
      final_buyout_price: "0",
    }),
  },
  online: {
    fields: [
      { name: "listed_price", label: "Prix affiché (€ TTC)", type: "money", required: true },
      { name: "published_site", label: "Publié sur le site", type: "checkbox" },
      { name: "published_site_at", label: "Date de publication sur le site", type: "date", required: true, showIf: (v) => v.published_site === "true" },
      { name: "published_lbc", label: "Publié sur Leboncoin", type: "checkbox" },
      { name: "published_lbc_at", label: "Date de publication sur Leboncoin", type: "date", required: true, showIf: (v) => v.published_lbc === "true" },
    ],
    defaults: (c) => ({
      listed_price: s(c.listed_price ?? c.expected_sale_price),
      published_site: c.published_site ? "true" : "",
      published_site_at: c.published_site_at ?? c.today,
      published_lbc: c.published_lbc ? "true" : "",
      published_lbc_at: c.published_lbc_at ?? c.today,
    }),
  },
  sold: {
    fields: [
      { name: "final_sale_price", label: "Prix de vente final (€ TTC)", type: "money", required: true },
      { name: "sale_channel", label: "Canal de vente", type: "radio", required: true, options: SALE_CHANNEL_LABELS },
      { name: "sold_at", label: "Date de vente", type: "date", required: true },
    ],
    optionalEmail: (_v, c) => (c.mode === "consignment" ? "sold_consignment" : null),
    defaults: (c) => ({ final_sale_price: s(c.final_sale_price ?? c.listed_price), sale_channel: s(c.sale_channel), sold_at: c.sold_at ?? c.today }),
  },
  done: {
    fields: [{ name: "picked_up_by_buyer_at", label: "Date de retrait par l'acheteur", type: "date", required: true }],
    defaults: (c) => ({ picked_up_by_buyer_at: c.today }),
  },
  returned: {
    fields: [{ name: "returned_at", label: "Date de restitution", type: "date", required: true }],
    defaults: (c) => ({ returned_at: c.today }),
  },
};

export function transitionDefaults(to: FurnitureStatus, ctx: TransitionContext): Record<string, string> {
  return { __from: ctx.from, ...(TRANSITIONS[to]?.defaults?.(ctx) ?? {}) };
}

export function visibleFields(to: FurnitureStatus, values: Record<string, string>) {
  return (TRANSITIONS[to]?.fields ?? []).filter((f) => !f.showIf || f.showIf(values));
}

// ---------------------------------------------------------------------------
// Validation serveur : valeurs du formulaire (chaînes) → colonnes de `furnitures`.
// ---------------------------------------------------------------------------
const money = z
  .string()
  .trim()
  .transform((v) => Number(v.replace(/\s/g, "").replace(",", ".")))
  .pipe(z.number({ error: "Montant invalide." }).nonnegative("Montant invalide.").max(10_000_000));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const isTrue = (v?: string) => v === "true";

export type TransitionPayload = {
  fields: Record<string, string | number | boolean | null>;
  appointment?: { type: "seller_pickup"; appointment_date: string; period: "morning" | "afternoon"; note: string | null };
};

/** Valide et convertit les saisies ; renvoie un message d'erreur en français si invalide. */
export function parseTransition(
  to: FurnitureStatus,
  from: FurnitureStatus,
  raw: Record<string, string>,
): { ok: true; payload: TransitionPayload } | { ok: false; error: string } {
  const values: Record<string, string> = { ...raw, __from: from };
  for (const f of visibleFields(to, values)) {
    if (f.required && !(values[f.name] ?? "").trim()) return { ok: false, error: `Champ obligatoire : ${f.label}.` };
  }
  try {
    const fields: TransitionPayload["fields"] = {};
    const optMoney = (k: string) => ((values[k] ?? "").trim() ? money.parse(values[k]) : null);
    switch (to) {
      case "refused":
        fields.refusal_reason = z.enum(Object.keys(REFUSAL_REASON_LABELS) as [string, ...string[]]).parse(values.refusal_reason);
        break;
      case "offer_sent":
        fields.offer_buyout_price = money.parse(values.offer_buyout_price);
        fields.expected_sale_price = money.parse(values.expected_sale_price);
        fields.transport_cost = money.parse(values.transport_cost);
        fields.consignment_terms = (values.consignment_terms ?? "").trim() || null;
        fields.offer_sent_at = new Date().toISOString();
        break;
      case "offer_accepted": {
        const mode = z.enum(["buyout", "consignment"]).parse(values.mode);
        fields.mode = mode;
        fields.final_buyout_price = mode === "buyout" ? money.parse(values.final_buyout_price) : null;
        break;
      }
      case "pickup_scheduled":
        return {
          ok: true,
          payload: {
            fields: {},
            appointment: {
              type: "seller_pickup",
              appointment_date: date.parse(values.pickup_date),
              period: z.enum(["morning", "afternoon"]).parse(values.pickup_period),
              note: (values.pickup_note ?? "").trim() || null,
            },
          },
        };
      case "received":
        fields.received_at = date.parse(values.received_at);
        break;
      case "non_conform":
        fields.conformity_report = z.string().trim().min(1).max(5000).parse(values.conformity_report);
        fields.non_conform_choice = values.non_conform_choice ? z.enum(["client_pickup", "carrier_return"]).parse(values.non_conform_choice) : null;
        fields.return_quote = optMoney("return_quote");
        fields.non_conform_at = new Date().toISOString();
        break;
      case "preparing":
        if (from === "non_conform" && isTrue(values.abandoned)) {
          fields.is_abandoned = true;
          fields.mode = "buyout";
          fields.final_buyout_price = money.parse(values.final_buyout_price || "0");
        }
        break;
      case "online":
        fields.listed_price = money.parse(values.listed_price);
        fields.published_site = isTrue(values.published_site);
        fields.published_site_at = isTrue(values.published_site) ? date.parse(values.published_site_at) : null;
        fields.published_lbc = isTrue(values.published_lbc);
        fields.published_lbc_at = isTrue(values.published_lbc) ? date.parse(values.published_lbc_at) : null;
        break;
      case "sold":
        fields.final_sale_price = money.parse(values.final_sale_price);
        fields.sale_channel = z.enum(["site", "leboncoin", "other"]).parse(values.sale_channel);
        fields.sold_at = date.parse(values.sold_at);
        break;
      case "done":
        fields.picked_up_by_buyer_at = date.parse(values.picked_up_by_buyer_at);
        break;
      case "returned":
        fields.returned_at = date.parse(values.returned_at);
        break;
    }
    return { ok: true, payload: { fields } };
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : null;
    return { ok: false, error: msg ?? "Saisie invalide." };
  }
}
