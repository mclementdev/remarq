/**
 * Agrégats du dashboard (§11). Fonctions pures : les chiffres reposent sur la date de vente.
 */
import { addMonths, differenceInCalendarDays, format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { marginFromRow } from "./margin";

export type DashboardRow = {
  id: string;
  name: string;
  status: string;
  mode: "buyout" | "consignment" | null;
  sold_at: string | null;
  received_at: string | null;
  final_sale_price: number | null;
  final_buyout_price: number | null;
  consignment_commission: number | null;
  adjustments_total: number | null;
  hours_total: number | null;
  first_accepted_at: string | null;
  first_refused_at: string | null;
};

/** "2026-10" → bornes AAAA-MM-JJ du mois. */
export function monthBounds(month: string) {
  const start = parse(`${month}-01`, "yyyy-MM-dd", new Date());
  return { start: format(start, "yyyy-MM-dd"), end: format(addMonths(start, 1), "yyyy-MM-dd") };
}

export function shiftMonth(month: string, delta: number) {
  return format(addMonths(parse(`${month}-01`, "yyyy-MM-dd", new Date()), delta), "yyyy-MM");
}

export function monthLabel(month: string, style: "long" | "short" = "long") {
  return format(parse(`${month}-01`, "yyyy-MM-dd", new Date()), style === "long" ? "LLLL yyyy" : "LLL yy", { locale: fr });
}

const inMonth = (day: string | null, month: string) => !!day && day.slice(0, 7) === month;

export type MonthStats = {
  month: string;
  soldCount: number;
  revenue: number;
  margin: number;
  /** Meubles vendus dont la marge n'est pas calculable (données manquantes). */
  incompleteMargins: number;
  averageMargin: number | null;
  buyout: { count: number; revenue: number };
  consignment: { count: number; revenue: number };
  averageDaysToSell: number | null;
};

export function monthStats(rows: DashboardRow[], month: string, hourlyRate: number): MonthStats {
  const sold = rows.filter((r) => inMonth(r.sold_at, month));
  let margin = 0;
  let withMargin = 0;
  let incomplete = 0;
  const split = { buyout: { count: 0, revenue: 0 }, consignment: { count: 0, revenue: 0 } };
  const delays: number[] = [];
  for (const r of sold) {
    const m = marginFromRow(r, hourlyRate)?.margin ?? null;
    if (m === null) incomplete++;
    else {
      margin += m;
      withMargin++;
    }
    if (r.mode) {
      split[r.mode].count++;
      split[r.mode].revenue += Number(r.final_sale_price ?? 0);
    }
    if (r.received_at && r.sold_at) delays.push(differenceInCalendarDays(new Date(r.sold_at), new Date(r.received_at)));
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    month,
    soldCount: sold.length,
    revenue: round(sold.reduce((s, r) => s + Number(r.final_sale_price ?? 0), 0)),
    margin: round(margin),
    incompleteMargins: incomplete,
    averageMargin: withMargin ? round(margin / withMargin) : null,
    buyout: { count: split.buyout.count, revenue: round(split.buyout.revenue) },
    consignment: { count: split.consignment.count, revenue: round(split.consignment.revenue) },
    averageDaysToSell: delays.length ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10 : null,
  };
}

export function delta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return { value: null, percent: null };
  return { value: Math.round((current - previous) * 100) / 100, percent: previous === 0 ? null : (current - previous) / Math.abs(previous) };
}

/** Taux d'acceptation du mois : acceptés / (acceptés + refusés), selon la date de décision (Paris). */
export function acceptanceRate(rows: DashboardRow[], month: string, toParisDay: (iso: string) => string) {
  let accepted = 0;
  let refused = 0;
  for (const r of rows) {
    if (r.first_accepted_at && inMonth(toParisDay(r.first_accepted_at), month)) accepted++;
    else if (!r.first_accepted_at && r.first_refused_at && inMonth(toParisDay(r.first_refused_at), month)) refused++;
  }
  return { accepted, refused, rate: accepted + refused ? accepted / (accepted + refused) : null };
}

/** Stock immobilisé : meubles physiquement chez Remarq, non vendus. */
export const IN_STOCK_STATUSES = ["received", "non_conform", "preparing", "online"];

export function immobilizedStock(rows: DashboardRow[]) {
  const stock = rows.filter((r) => IN_STOCK_STATUSES.includes(r.status) && !r.sold_at);
  const buyout = stock.filter((r) => r.mode === "buyout");
  return {
    buyoutValue: Math.round(buyout.reduce((s, r) => s + Number(r.final_buyout_price ?? 0), 0) * 100) / 100,
    buyoutCount: buyout.length,
    consignmentCount: stock.filter((r) => r.mode === "consignment").length,
  };
}

export function last12Months(rows: DashboardRow[], month: string, hourlyRate: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = shiftMonth(month, i - 11);
    const s = monthStats(rows, m, hourlyRate);
    return { month: m, label: monthLabel(m, "short"), revenue: s.revenue, margin: s.margin };
  });
}
