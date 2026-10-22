import { formatDateTime } from "@/lib/format";
import { formatDuration, statusDurations } from "@/lib/calc/aging";
import { describePayload } from "@/lib/history";
import { STATUS_SHORT_LABELS, type FurnitureStatus } from "@/lib/status";
import type { ActivityLog, StatusHistory } from "@/lib/types";

const KIND_ICONS: Record<string, string> = {
  status: "●",
  email_prepared: "✉",
  field_update: "✎",
  note: "✍",
  appointment: "◷",
  photo: "▣",
  ai_generation: "✦",
  finance: "€",
  time: "⧗",
};

type Props = {
  history: StatusHistory[];
  activity: ActivityLog[];
  authors: Record<string, string>;
};

export function HistorySection({ history, activity, authors }: Props) {
  const spans = statusDurations(history);
  const items = [
    ...history.map((h) => ({
      id: h.id,
      at: h.changed_at,
      kind: "status",
      author: h.author_id ? authors[h.author_id] : h.from_status === null ? "Formulaire public" : null,
      title: h.from_status
        ? `${STATUS_SHORT_LABELS[h.from_status as FurnitureStatus]} → ${STATUS_SHORT_LABELS[h.to_status as FurnitureStatus]}`
        : `Demande reçue (${STATUS_SHORT_LABELS[h.to_status as FurnitureStatus]})`,
      details: describePayload(h.payload),
    })),
    ...activity.map((a) => ({
      id: a.id,
      at: a.created_at,
      kind: a.kind as string,
      author: a.author_id ? authors[a.author_id] : null,
      title: a.label,
      details: [] as string[],
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm text-ink-muted">Durée dans chaque statut</h3>
        <ol className="flex flex-wrap gap-2 text-xs">
          {spans.map((s, i) => (
            <li key={i} className="rounded-badge border border-line-soft px-2 py-1">
              <span>{STATUS_SHORT_LABELS[s.status as FurnitureStatus]}</span>
              <span className="ml-1.5 text-ink-muted">{formatDuration(s.ms)}{s.to === null && " (en cours)"}</span>
            </li>
          ))}
        </ol>
      </div>
      <ol className="relative space-y-4 border-l border-line-soft pl-5" aria-label="Historique">
        {items.map((it) => (
          <li key={`${it.kind}-${it.id}`} className="relative text-sm">
            <span aria-hidden className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-paper text-[11px]">
              {KIND_ICONS[it.kind] ?? "•"}
            </span>
            <p className={it.kind === "status" ? "font-medium" : undefined}>{it.title}</p>
            {it.details.length > 0 && (
              <ul className="mt-0.5 text-xs text-ink-soft">
                {it.details.map((d) => <li key={d} className="whitespace-pre-line">{d}</li>)}
              </ul>
            )}
            <p className="text-xs text-ink-muted">
              {formatDateTime(it.at)}{it.author && ` · ${it.author}`}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
