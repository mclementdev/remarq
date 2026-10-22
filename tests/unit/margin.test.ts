import { describe, expect, it } from "vitest";
import { computeMargin } from "@/lib/calc/margin";

const base = { finalSalePrice: 2400, finalBuyoutPrice: 1200, consignmentCommission: null, adjustmentsTotal: 0, hoursTotal: 0, hourlyRate: 0 };

describe("marge — rachat direct", () => {
  it("marge brute = vente − rachat + ajustements", () => {
    const r = computeMargin({ ...base, mode: "buyout", adjustmentsTotal: -45.5 })!;
    expect(r.grossMargin).toBe(1154.5);
    expect(r.netMargin).toBe(1154.5);
    expect(r.margin).toBe(1154.5);
    expect(r.missing).toEqual([]);
  });

  it("taux horaire à 0 : le temps n'est pas valorisé, la marge retenue est la brute", () => {
    const r = computeMargin({ ...base, mode: "buyout", hoursTotal: 6.5, hourlyRate: 0 })!;
    expect(r.billableTime).toBe(0);
    expect(r.margin).toBe(r.grossMargin);
  });

  it("taux horaire > 0 : marge nette = brute − heures × taux, et c'est elle qui est retenue", () => {
    const r = computeMargin({ ...base, mode: "buyout", adjustmentsTotal: 30, hoursTotal: 2.75, hourlyRate: 40 })!;
    expect(r.grossMargin).toBe(1230);
    expect(r.billableTime).toBe(110);
    expect(r.netMargin).toBe(1120);
    expect(r.margin).toBe(1120);
  });

  it("gain et dépense se compensent (lignes signées)", () => {
    const r = computeMargin({ ...base, mode: "buyout", adjustmentsTotal: 50 - 80 })!;
    expect(r.grossMargin).toBe(1170);
  });

  it("meuble abandonné : rachat à 0 €, toute la vente est de la marge", () => {
    const r = computeMargin({ ...base, mode: "buyout", finalBuyoutPrice: 0 })!;
    expect(r.margin).toBe(2400);
  });

  it("non vendu : pas de marge, champ manquant signalé", () => {
    const r = computeMargin({ ...base, mode: "buyout", finalSalePrice: null })!;
    expect(r.margin).toBeNull();
    expect(r.missing).toContain("prix de vente final");
  });

  it("détaille le calcul ligne par ligne", () => {
    const r = computeMargin({ ...base, mode: "buyout", hoursTotal: 1, hourlyRate: 30 })!;
    expect(r.lines.map((l) => l.label)).toEqual([
      "Prix de vente final",
      "− Prix de rachat final",
      "± Lignes d'ajustement",
      "= Marge brute",
      "− Temps passé",
      "= Marge nette",
    ]);
  });
});

describe("marge — dépôt-vente", () => {
  const consign = { ...base, mode: "consignment" as const, finalBuyoutPrice: null, consignmentCommission: 600 };

  it("recette = commission + temps refacturable + ajustements", () => {
    const r = computeMargin({ ...consign, hoursTotal: 3, hourlyRate: 35, adjustmentsTotal: -20 })!;
    expect(r.billableTime).toBe(105);
    expect(r.revenue).toBe(685);
    expect(r.margin).toBe(685);
  });

  it("montant à reverser = vente − commission − temps refacturable", () => {
    const r = computeMargin({ ...consign, hoursTotal: 3, hourlyRate: 35, adjustmentsTotal: -20 })!;
    expect(r.amountToReverse).toBe(1695);
  });

  it("affiche le % de commission équivalent", () => {
    const r = computeMargin(consign)!;
    expect(r.commissionRate).toBeCloseTo(0.25);
  });

  it("taux horaire à 0 : recette = commission + ajustements", () => {
    const r = computeMargin({ ...consign, hoursTotal: 10, adjustmentsTotal: 15 })!;
    expect(r.revenue).toBe(615);
    expect(r.amountToReverse).toBe(1800);
  });

  it("commission manquante : pas de recette", () => {
    const r = computeMargin({ ...consign, consignmentCommission: null })!;
    expect(r.revenue).toBeNull();
    expect(r.missing).toContain("commission");
  });
});

describe("marge — mode inconnu", () => {
  it("renvoie null tant que le mode n'est pas choisi", () => {
    expect(computeMargin({ ...base, mode: null })).toBeNull();
  });
});
