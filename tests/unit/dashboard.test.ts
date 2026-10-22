import { describe, expect, it } from "vitest";
import { acceptanceRate, delta, immobilizedStock, last12Months, monthStats, type DashboardRow } from "@/lib/calc/dashboard";

const row = (o: Partial<DashboardRow>): DashboardRow => ({
  id: Math.random().toString(),
  name: "x",
  status: "sold",
  mode: "buyout",
  sold_at: null,
  received_at: null,
  final_sale_price: null,
  final_buyout_price: null,
  consignment_commission: null,
  adjustments_total: 0,
  hours_total: 0,
  first_accepted_at: null,
  first_refused_at: null,
  ...o,
});

const rows = [
  row({ sold_at: "2026-10-03", received_at: "2026-09-23", final_sale_price: 2000, final_buyout_price: 1200, adjustments_total: -50 }), // marge 750
  row({ sold_at: "2026-10-28", received_at: "2026-10-08", mode: "consignment", final_sale_price: 1000, consignment_commission: 300, hours_total: 2 }), // recette 300 (+ temps)
  row({ sold_at: "2026-10-31", mode: "buyout", final_sale_price: 500 }), // marge incalculable
  row({ sold_at: "2026-09-15", final_sale_price: 1500, final_buyout_price: 1000 }), // mois précédent : 500
  row({ sold_at: "2026-11-01", final_sale_price: 9999, final_buyout_price: 1 }), // mois suivant
];

describe("dashboard", () => {
  it("totalise le mois sur la date de vente", () => {
    const s = monthStats(rows, "2026-10", 0);
    expect(s.soldCount).toBe(3);
    expect(s.revenue).toBe(3500);
    expect(s.margin).toBe(1050);
    expect(s.incompleteMargins).toBe(1);
    expect(s.averageMargin).toBe(525);
    expect(s.buyout).toEqual({ count: 2, revenue: 2500 });
    expect(s.consignment).toEqual({ count: 1, revenue: 1000 });
    expect(s.averageDaysToSell).toBe(15);
  });

  it("valorise le temps quand le taux horaire est > 0 (marge nette / temps refacturable)", () => {
    const s = monthStats(rows, "2026-10", 30);
    // rachat : 750 (0 h) ; dépôt : 300 + 2 × 30 = 360
    expect(s.margin).toBe(1110);
  });

  it("calcule l'écart avec le mois précédent", () => {
    const cur = monthStats(rows, "2026-10", 0);
    const prev = monthStats(rows, "2026-09", 0);
    expect(delta(cur.margin, prev.margin)).toEqual({ value: 550, percent: 1.1 });
    expect(delta(5, 0).percent).toBeNull();
  });

  it("série sur 12 mois se terminant par le mois choisi", () => {
    const series = last12Months(rows, "2026-10", 0);
    expect(series).toHaveLength(12);
    expect(series[11]).toMatchObject({ month: "2026-10", revenue: 3500, margin: 1050 });
    expect(series[10]).toMatchObject({ month: "2026-09", revenue: 1500 });
    expect(series[0].month).toBe("2025-11");
  });

  it("taux d'acceptation sur les décisions du mois", () => {
    const decisions = [
      row({ first_accepted_at: "2026-10-02T10:00:00Z" }),
      row({ first_accepted_at: "2026-10-05T10:00:00Z", first_refused_at: "2026-10-01T10:00:00Z" }),
      row({ first_refused_at: "2026-10-10T10:00:00Z" }),
      row({ first_refused_at: "2026-09-10T10:00:00Z" }),
    ];
    const r = acceptanceRate(decisions, "2026-10", (iso) => iso.slice(0, 10));
    expect(r).toEqual({ accepted: 2, refused: 1, rate: 2 / 3 });
  });

  it("stock immobilisé : rachats non vendus en stock + nombre de dépôts", () => {
    const s = immobilizedStock([
      row({ status: "online", mode: "buyout", final_buyout_price: 800 }),
      row({ status: "preparing", mode: "buyout", final_buyout_price: 200 }),
      row({ status: "online", mode: "consignment" }),
      row({ status: "pickup_scheduled", mode: "buyout", final_buyout_price: 999 }),
      row({ status: "sold", mode: "buyout", final_buyout_price: 999, sold_at: "2026-10-01" }),
    ]);
    expect(s).toEqual({ buyoutValue: 1000, buyoutCount: 2, consignmentCount: 1 });
  });
});
