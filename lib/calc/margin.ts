/**
 * Calcul de marge (cahier des charges §8 et §11). Fonctions pures.
 * Tous les montants sont en euros TTC. Lignes d'ajustement signées :
 * une dépense est un montant négatif.
 */

export type MarginInput = {
  mode: "buyout" | "consignment" | null;
  finalSalePrice: number | null;
  finalBuyoutPrice: number | null;
  consignmentCommission: number | null;
  /** Somme signée des lignes d'ajustement. */
  adjustmentsTotal: number;
  hoursTotal: number;
  hourlyRate: number;
};

export type MarginLine = {
  label: string;
  amount: number;
  /** "base" = valeur de départ, "op" = ajoutée / retranchée, "total" = résultat. */
  kind: "base" | "op" | "total" | "info";
  detail?: string;
};

export type MarginResult = {
  mode: "buyout" | "consignment";
  /** Marge retenue (rachat : nette si taux > 0, sinon brute ; dépôt-vente : recette). */
  margin: number | null;
  /** Rachat uniquement. */
  grossMargin: number | null;
  netMargin: number | null;
  /** Dépôt-vente uniquement. */
  revenue: number | null;
  billableTime: number;
  amountToReverse: number | null;
  commissionRate: number | null;
  lines: MarginLine[];
  missing: string[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const n = (v: number | string | null | undefined) => (v === null || v === undefined || v === "" ? null : Number(v));

export function computeMargin(input: MarginInput): MarginResult | null {
  if (!input.mode) return null;
  const sale = n(input.finalSalePrice);
  const hours = Number(input.hoursTotal) || 0;
  const rate = Number(input.hourlyRate) || 0;
  const adjustments = round2(Number(input.adjustmentsTotal) || 0);
  const timeCost = round2(hours * rate);
  const timeDetail = `${hours.toLocaleString("fr-FR")} h × ${rate.toLocaleString("fr-FR")} €/h`;
  const missing: string[] = [];

  if (input.mode === "buyout") {
    const buyout = n(input.finalBuyoutPrice);
    if (sale === null) missing.push("prix de vente final");
    if (buyout === null) missing.push("prix de rachat final");
    const gross = sale !== null && buyout !== null ? round2(sale - buyout + adjustments) : null;
    const net = gross !== null ? round2(gross - timeCost) : null;
    const lines: MarginLine[] = [
      { label: "Prix de vente final", amount: sale ?? 0, kind: "base" },
      { label: "− Prix de rachat final", amount: -(buyout ?? 0), kind: "op" },
      { label: "± Lignes d'ajustement", amount: adjustments, kind: "op" },
      { label: "= Marge brute", amount: gross ?? 0, kind: "total" },
      { label: "− Temps passé", amount: -timeCost, kind: "op", detail: timeDetail },
      { label: "= Marge nette", amount: net ?? 0, kind: "total" },
    ];
    return {
      mode: "buyout",
      margin: rate > 0 ? net : gross,
      grossMargin: gross,
      netMargin: net,
      revenue: null,
      billableTime: timeCost,
      amountToReverse: null,
      commissionRate: null,
      lines,
      missing,
    };
  }

  const commission = n(input.consignmentCommission);
  if (commission === null) missing.push("commission");
  if (sale === null) missing.push("prix de vente final");
  const revenue = commission !== null ? round2(commission + timeCost + adjustments) : null;
  const toReverse = sale !== null && commission !== null ? round2(sale - commission - timeCost) : null;
  const commissionRate = commission !== null && sale ? commission / sale : null;
  const lines: MarginLine[] = [
    { label: "Commission", amount: commission ?? 0, kind: "base", detail: commissionRate !== null ? `${(Math.round(commissionRate * 1000) / 10).toLocaleString("fr-FR")} % du prix de vente` : undefined },
    { label: "+ Temps refacturable", amount: timeCost, kind: "op", detail: timeDetail },
    { label: "± Lignes d'ajustement", amount: adjustments, kind: "op" },
    { label: "= Recette", amount: revenue ?? 0, kind: "total" },
    { label: "Montant à reverser au déposant", amount: toReverse ?? 0, kind: "info", detail: "prix de vente final − commission − temps refacturable" },
  ];
  return {
    mode: "consignment",
    margin: revenue,
    grossMargin: null,
    netMargin: null,
    revenue,
    billableTime: timeCost,
    amountToReverse: toReverse,
    commissionRate,
    lines,
    missing,
  };
}

/** Raccourci depuis une ligne de `furniture_overview`. */
export function marginFromRow(
  row: {
    mode: "buyout" | "consignment" | null;
    final_sale_price: number | null;
    final_buyout_price: number | null;
    consignment_commission: number | null;
    adjustments_total: number | null;
    hours_total: number | null;
  },
  hourlyRate: number,
) {
  return computeMargin({
    mode: row.mode,
    finalSalePrice: row.final_sale_price,
    finalBuyoutPrice: row.final_buyout_price,
    consignmentCommission: row.consignment_commission,
    adjustmentsTotal: Number(row.adjustments_total ?? 0),
    hoursTotal: Number(row.hours_total ?? 0),
    hourlyRate,
  });
}
