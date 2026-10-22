import { addDays, differenceInCalendarDays, format } from "date-fns";
import { TZDate } from "@date-fns/tz";

const TZ = "Europe/Paris";

function parisDate(value: string | Date) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new TZDate(`${value}T12:00:00`, TZ);
  return new TZDate(new Date(value), TZ);
}

/**
 * Nombre de jours calendaires (Europe/Paris) écoulés depuis `since`.
 * 0 = aujourd'hui, 1 = hier… (§6 « depuis X jours »).
 */
export function daysSince(since: string | Date, now: Date = new Date()) {
  return Math.max(0, differenceInCalendarDays(parisDate(now), parisDate(since)));
}

/** « aujourd'hui », « depuis 1 jour », « depuis 12 jours ». */
export function agingLabel(since: string | Date, now: Date = new Date()) {
  const d = daysSince(since, now);
  if (d === 0) return "depuis aujourd'hui";
  return `depuis ${d} jour${d > 1 ? "s" : ""}`;
}

export type NonConformCounter = {
  /** J+X : jours écoulés depuis le passage en non conforme (J+0 le jour même). */
  day: number;
  delay: number;
  /** Date limite = jour du passage + délai (AAAA-MM-JJ, Paris). */
  deadline: string;
  /** Vrai quand la date limite est passée (aujourd'hui > date limite). */
  expired: boolean;
  label: string;
};

/** Compteur de non-conformité « J+X / 15 » (§6). */
export function nonConformCounter(nonConformAt: string | Date, delayDays: number, now: Date = new Date()): NonConformCounter {
  const start = parisDate(nonConformAt);
  const day = daysSince(start, now);
  const deadlineDate = addDays(start, delayDays);
  return {
    day,
    delay: delayDays,
    deadline: format(deadlineDate, "yyyy-MM-dd"),
    expired: day > delayDays,
    label: `J+${day} / ${delayDays}`,
  };
}

export type StatusSpan = { status: string; from: string; to: string | null; days: number; ms: number };

/**
 * Durée passée dans chaque statut à partir de l'historique trié (frise §6).
 * Le dernier statut court jusqu'à `now`.
 */
export function statusDurations(
  history: { to_status: string; changed_at: string }[],
  now: Date = new Date(),
): StatusSpan[] {
  const sorted = [...history].sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  return sorted.map((h, i) => {
    const next = sorted[i + 1];
    const end = next ? new Date(next.changed_at) : now;
    const ms = Math.max(0, end.getTime() - new Date(h.changed_at).getTime());
    return { status: h.to_status, from: h.changed_at, to: next?.changed_at ?? null, ms, days: ms / 86_400_000 };
  });
}

/** « 3 j 4 h », « 5 h », « 12 min ». */
export function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${days} j ${rest} h` : `${days} j`;
}
