import { describe, expect, it } from "vitest";
import { parseTransition, visibleFields } from "@/lib/transitions";

describe("transitions", () => {
  it("exige le motif d'un refus", () => {
    expect(parseTransition("refused", "new", {})).toEqual({ ok: false, error: "Champ obligatoire : Motif du refus." });
    const ok = parseTransition("refused", "new", { refusal_reason: "bad_condition" });
    expect(ok.ok && ok.payload.fields).toEqual({ refusal_reason: "bad_condition" });
  });

  it("convertit les montants saisis à la française", () => {
    const r = parseTransition("offer_sent", "accepted", {
      offer_buyout_price: "1 200,50",
      expected_sale_price: "2400",
      transport_cost: "150",
      consignment_terms: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.fields.offer_buyout_price).toBe(1200.5);
      expect(r.payload.fields.consignment_terms).toBeNull();
      expect(r.payload.fields.offer_sent_at).toBeTruthy();
    }
  });

  it("rejette un montant invalide", () => {
    const r = parseTransition("sold", "online", { final_sale_price: "abc", sale_channel: "site", sold_at: "2026-10-21" });
    expect(r.ok).toBe(false);
  });

  it("dépôt-vente : pas de prix de rachat final", () => {
    expect(visibleFields("offer_accepted", { mode: "consignment" }).map((f) => f.name)).toEqual(["mode"]);
    const r = parseTransition("offer_accepted", "offer_sent", { mode: "consignment", final_buyout_price: "999" });
    expect(r.ok && r.payload.fields).toEqual({ mode: "consignment", final_buyout_price: null });
  });

  it("rachat : prix de rachat final obligatoire", () => {
    expect(parseTransition("offer_accepted", "offer_sent", { mode: "buyout" }).ok).toBe(false);
  });

  it("enlèvement planifié : crée un rendez-vous", () => {
    const r = parseTransition("pickup_scheduled", "offer_accepted", { pickup_date: "2026-10-27", pickup_period: "morning" });
    expect(r.ok && r.payload.appointment).toEqual({ type: "seller_pickup", appointment_date: "2026-10-27", period: "morning", note: null });
  });

  it("abandon d'un non-conforme : bascule en rachat à 0 € modifiable", () => {
    const r = parseTransition("preparing", "non_conform", { abandoned: "true", final_buyout_price: "0" });
    expect(r.ok && r.payload.fields).toEqual({ is_abandoned: true, mode: "buyout", final_buyout_price: 0 });
    const kept = parseTransition("preparing", "received", { abandoned: "true" });
    expect(kept.ok && kept.payload.fields).toEqual({});
  });

  it("non conforme : démarre le compteur", () => {
    const r = parseTransition("non_conform", "received", { conformity_report: "Pied cassé" });
    expect(r.ok && r.payload.fields.non_conform_at).toBeTruthy();
  });
});
