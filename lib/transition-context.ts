import { nonConformCounter } from "@/lib/calc/aging";
import { parisDay } from "@/lib/format";
import type { FurnitureStatus } from "@/lib/status";
import type { TransitionContext } from "@/lib/transitions";
import type { AppSettings } from "@/lib/settings";
import type { FurnitureOverview } from "@/lib/types";

const num = (v: number | null | undefined) => (v === null || v === undefined ? null : Number(v));

/** Contexte de pré-remplissage des fenêtres de transition. */
export function buildTransitionContext(f: FurnitureOverview, settings: AppSettings): TransitionContext {
  return {
    from: f.status as FurnitureStatus,
    today: parisDay(),
    offer_buyout_price: num(f.offer_buyout_price),
    expected_sale_price: num(f.expected_sale_price),
    transport_cost: num(f.transport_cost),
    consignment_terms: f.consignment_terms,
    mode: f.mode,
    final_buyout_price: num(f.final_buyout_price),
    received_at: f.received_at,
    conformity_report: f.conformity_report,
    non_conform_choice: f.non_conform_choice,
    return_quote: num(f.return_quote),
    listed_price: num(f.listed_price),
    published_site: !!f.published_site,
    published_site_at: f.published_site_at,
    published_lbc: !!f.published_lbc,
    published_lbc_at: f.published_lbc_at,
    final_sale_price: num(f.final_sale_price),
    sale_channel: f.sale_channel,
    sold_at: f.sold_at,
    refusal_reason: f.refusal_reason,
    nonConformExpired:
      f.status === "non_conform" && !!f.non_conform_at && nonConformCounter(f.non_conform_at, settings.non_conform_delay_days).expired,
  };
}

/** Données de la fiche utilisées par les variables d'e-mail. */
export function emailFurniture(f: FurnitureOverview) {
  return {
    name: f.name ?? "",
    seller_first_name: f.seller_first_name ?? "",
    seller_email: f.seller_email ?? "",
    seller_phone: f.seller_phone ?? "",
    seller_street: f.seller_street ?? "",
    seller_postal_code: f.seller_postal_code ?? "",
    seller_city: f.seller_city ?? "",
    floor: f.floor,
    has_elevator: f.has_elevator,
    access_notes: f.access_notes,
    mode: f.mode,
    offer_buyout_price: num(f.offer_buyout_price),
    expected_sale_price: num(f.expected_sale_price),
    transport_cost: num(f.transport_cost),
    conformity_report: f.conformity_report,
    return_quote: num(f.return_quote),
    non_conform_at: f.non_conform_at,
    final_sale_price: num(f.final_sale_price),
  };
}
