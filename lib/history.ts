import { formatDate, formatEuro } from "@/lib/format";
import {
  MODE_LONG_LABELS,
  NON_CONFORM_CHOICE_LABELS,
  REFUSAL_REASON_LABELS,
  SALE_CHANNEL_LABELS,
  type Mode,
  type NonConformChoice,
  type RefusalReason,
  type SaleChannel,
} from "@/lib/labels";

type Formatter = (v: unknown) => string;
const euro: Formatter = (v) => formatEuro(v as number);
const date: Formatter = (v) => formatDate(v as string);
const bool: Formatter = (v) => (v ? "oui" : "non");
const text: Formatter = (v) => String(v);

/** Libellés et formats des données saisies lors des changements de statut. */
export const TRANSITION_FIELDS: Record<string, { label: string; format: Formatter }> = {
  refusal_reason: { label: "Motif", format: (v) => REFUSAL_REASON_LABELS[v as RefusalReason] ?? String(v) },
  offer_buyout_price: { label: "Prix de rachat proposé", format: euro },
  expected_sale_price: { label: "Prix de vente espéré", format: euro },
  transport_cost: { label: "Coût de transport", format: euro },
  consignment_terms: { label: "Conditions dépôt-vente", format: text },
  mode: { label: "Mode choisi", format: (v) => MODE_LONG_LABELS[v as Mode] ?? String(v) },
  final_buyout_price: { label: "Prix de rachat final", format: euro },
  received_at: { label: "Date de réception", format: date },
  conformity_report: { label: "Constat", format: text },
  non_conform_choice: { label: "Choix du client", format: (v) => NON_CONFORM_CHOICE_LABELS[v as NonConformChoice] ?? String(v) },
  return_quote: { label: "Devis retour", format: euro },
  is_abandoned: { label: "Abandonné par le client", format: bool },
  listed_price: { label: "Prix affiché", format: euro },
  published_site: { label: "Publié sur le site", format: bool },
  published_site_at: { label: "Date de publication site", format: date },
  published_lbc: { label: "Publié sur Leboncoin", format: bool },
  published_lbc_at: { label: "Date de publication Leboncoin", format: date },
  final_sale_price: { label: "Prix de vente final", format: euro },
  sale_channel: { label: "Canal de vente", format: (v) => SALE_CHANNEL_LABELS[v as SaleChannel] ?? String(v) },
  sold_at: { label: "Date de vente", format: date },
  picked_up_by_buyer_at: { label: "Retrait par l'acheteur", format: date },
  returned_at: { label: "Date de restitution", format: date },
  pickup_date: { label: "Enlèvement", format: date },
  pickup_period: { label: "Créneau", format: (v) => (v === "morning" ? "matin" : "après-midi") },
};

/** Transforme le payload d'un changement de statut en lignes « Libellé : valeur ». */
export function describePayload(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  return Object.entries(payload as Record<string, unknown>)
    .filter(([k, v]) => k in TRANSITION_FIELDS && v !== null && v !== "" && k !== "non_conform_at" && k !== "offer_sent_at")
    .map(([k, v]) => `${TRANSITION_FIELDS[k].label} : ${TRANSITION_FIELDS[k].format(v)}`);
}
