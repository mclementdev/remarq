import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const TIMEZONE = "Europe/Paris";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const euro2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** 1234.5 → « 1 234,5 € » ; null → « — ». */
export function formatEuro(value: number | string | null | undefined, opts: { cents?: boolean; signed?: boolean } = {}) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  const s = (opts.cents ? euro2 : euro).format(n);
  return opts.signed && n > 0 ? `+${s}` : s;
}

export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return num.format(Number(value));
}

export function formatHours(hours: number) {
  return `${num.format(hours)} h`;
}

export function formatPercent(ratio: number | null) {
  if (ratio === null || !Number.isFinite(ratio)) return "—";
  return `${num.format(Math.round(ratio * 1000) / 10)} %`;
}

function toParis(value: string | Date) {
  // Une date seule (AAAA-MM-JJ) est un jour calendaire : on l'ancre à midi à Paris.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new TZDate(`${value}T12:00:00`, TIMEZONE);
  return new TZDate(new Date(value), TIMEZONE);
}

/** « 21/10/2026 » */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return format(toParis(value), "dd/MM/yyyy");
}

/** « 21/10/2026 à 14:05 » */
export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return format(toParis(value), "dd/MM/yyyy 'à' HH:mm");
}

/** « mardi 21 octobre 2026 » */
export function formatLongDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return format(toParis(value), "EEEE d MMMM yyyy", { locale: fr });
}

/** Jour calendaire à Paris au format AAAA-MM-JJ. */
export function parisDay(value: string | Date = new Date()) {
  return format(toParis(value), "yyyy-MM-dd");
}

export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${n} ${Math.abs(n) > 1 ? plural : singular}`;
}

/** Instant ISO du début (00:00) ou de la fin (23:59:59.999) d'un jour à Paris. */
export function parisDayBoundary(day: string, edge: "start" | "end") {
  const d = new TZDate(`${day}T${edge === "start" ? "00:00:00" : "23:59:59.999"}`, TIMEZONE);
  return new Date(d.getTime()).toISOString();
}
