import { addDays } from "date-fns";
import { EMAIL_TEMPLATES, VARIABLE_LABELS, type EmailTemplateKey } from "./templates";
import { accessText, furnitureLabel, sellerAddress } from "@/lib/furniture";
import { formatLongDate, formatNumber } from "@/lib/format";
import { MODE_LONG_LABELS, PERIOD_LABELS, type Mode, type Period } from "@/lib/labels";
import type { AppSettings } from "@/lib/settings";

export type EmailVars = Record<string, string | null | undefined>;

const VARIABLE = /\{\{\s*([a-z_]+)\s*\}\}/g;
/** Zones à compléter, y compris les variables manquantes. */
export const PLACEHOLDER = /\[à (?:compléter|valider)[^\]]*\]/g;

export function fillVariables(text: string, vars: EmailVars) {
  return text.replace(VARIABLE, (_m, name: string) => {
    const value = vars[name];
    if (value === null || value === undefined || String(value).trim() === "") {
      return `[à compléter : ${VARIABLE_LABELS[name] ?? name}]`;
    }
    return String(value);
  });
}

export function renderEmail(key: EmailTemplateKey, vars: EmailVars) {
  const template = EMAIL_TEMPLATES[key];
  // La signature peut elle-même contenir {{boutique}}.
  const resolved: EmailVars = { ...vars, signature: vars.signature ? fillVariables(vars.signature, vars) : vars.signature };
  return {
    name: template.name,
    subject: fillVariables(template.subject, resolved),
    body: fillVariables(template.body, resolved),
  };
}

export function findPlaceholders(text: string) {
  return text.match(PLACEHOLDER) ?? [];
}

type FurnitureForEmail = {
  name: string;
  seller_first_name: string;
  seller_phone: string;
  seller_street: string;
  seller_postal_code: string;
  seller_city: string;
  floor: string | null;
  has_elevator: boolean | null;
  access_notes: string | null;
  mode: string | null;
  offer_buyout_price: number | null;
  expected_sale_price: number | null;
  transport_cost: number | null;
  conformity_report: string | null;
  return_quote: number | null;
  non_conform_at: string | null;
  final_sale_price: number | null;
};

const amount = (v: number | null) => (v === null || v === undefined ? null : formatNumber(v).replace(/[\u202f\u00a0]/g, " "));

/** Construit toutes les variables à partir de la fiche, des réglages et du prochain enlèvement. */
export function buildEmailVars(
  f: FurnitureForEmail,
  brandName: string | null,
  settings: AppSettings,
  pickup?: { appointment_date: string; period: string } | null,
): EmailVars {
  const deadline = f.non_conform_at ? addDays(new Date(f.non_conform_at), settings.non_conform_delay_days) : null;
  return {
    prenom: f.seller_first_name,
    meuble: furnitureLabel(f.name, brandName),
    boutique: settings.shop_name,
    signature: settings.email_signature,
    validite: String(settings.offer_validity_days),
    prix_rachat: amount(f.offer_buyout_price),
    prix_vente_espere: amount(f.expected_sale_price),
    prix_transport: amount(f.transport_cost),
    date_enlevement: pickup ? formatLongDate(pickup.appointment_date) : null,
    creneau: pickup ? PERIOD_LABELS[pickup.period as Period]?.toLowerCase() : null,
    adresse_vendeur: sellerAddress(f),
    mode: f.mode ? MODE_LONG_LABELS[f.mode as Mode] : null,
    acces: accessText(f) || null,
    telephone: f.seller_phone,
    constat: f.conformity_report,
    adresse_atelier: settings.workshop_address || null,
    prix_retour: amount(f.return_quote),
    delai: String(settings.non_conform_delay_days),
    date_limite: deadline ? formatLongDate(deadline) : null,
    prix_vente: amount(f.final_sale_price),
  };
}
