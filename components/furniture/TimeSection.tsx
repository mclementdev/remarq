"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addTimeEntry, deleteTimeEntry } from "@/lib/actions/finance";
import { formatDate, formatEuro, formatHours, parisDay } from "@/lib/format";
import { TIME_TYPE_LABELS, type TimeType } from "@/lib/labels";
import type { TimeEntry } from "@/lib/types";

const QUICK = [0.25, 0.5, 1];

export function TimeSection({ furnitureId, entries, hourlyRate, authors }: { furnitureId: string; entries: TimeEntry[]; hourlyRate: number; authors: Record<string, string> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "cleaning", hours: "", entry_date: parisDay(), note: "" });
  const [optimistic, addOptimistic] = useOptimistic(entries, (list, entry: TimeEntry) => [entry, ...list]);

  const totals = Object.keys(TIME_TYPE_LABELS).map((t) => ({
    type: t as TimeType,
    hours: optimistic.filter((e) => e.type === t).reduce((s, e) => s + Number(e.hours), 0),
  }));
  const total = totals.reduce((s, t) => s + t.hours, 0);

  const add = (type: string, hours: number, entry_date = parisDay(), note = "") => {
    setError(null);
    startTransition(async () => {
      addOptimistic({ id: `tmp-${Math.random()}`, furniture_id: furnitureId, type: type as TimeType, hours, entry_date, note, author_id: null, created_at: new Date().toISOString() });
      const res = await addTimeEntry(furnitureId, { type, hours, entry_date, note });
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead className="sr-only"><tr><th>Type</th><th>Ajout rapide</th><th>Total</th></tr></thead>
        <tbody>
          {totals.map((t) => (
            <tr key={t.type} className="border-b border-line-soft">
              <th scope="row" className="py-2 text-left font-normal">{TIME_TYPE_LABELS[t.type]}</th>
              <td className="py-2">
                <div className="flex gap-1">
                  {QUICK.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className="btn-secondary btn-sm px-2"
                      disabled={pending}
                      onClick={() => add(t.type, h)}
                      aria-label={`Ajouter ${formatHours(h)} de ${TIME_TYPE_LABELS[t.type].toLowerCase()}`}
                    >
                      +{String(h).replace(".", ",")} h
                    </button>
                  ))}
                </div>
              </td>
              <td className="py-2 text-right tabular-nums" data-testid={`total-${t.type}`}>{formatHours(t.hours)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-2 text-left font-medium">Total général</th>
            <td className="py-2 text-xs text-ink-muted">{hourlyRate > 0 ? `soit ${formatEuro(total * hourlyRate, { cents: true })} à ${formatEuro(hourlyRate)}/h` : "non valorisé (taux à 0 €)"}</td>
            <td className="py-2 text-right font-medium tabular-nums" data-testid="total-hours">{formatHours(total)}</td>
          </tr>
        </tbody>
      </table>

      <form
        className="grid grid-cols-2 gap-2 rounded-ui bg-paper-alt p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const hours = Number(form.hours.replace(",", "."));
          add(form.type, hours, form.entry_date, form.note);
          setForm({ ...form, hours: "", note: "" });
        }}
      >
        <div>
          <label htmlFor="time-type" className="field-label text-xs">Type</label>
          <select id="time-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field">
            {Object.entries(TIME_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="time-hours" className="field-label text-xs">Heures (pas de 0,25)</label>
          <input id="time-hours" type="number" min="0.25" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="field" />
        </div>
        <div>
          <label htmlFor="time-date" className="field-label text-xs">Date</label>
          <input id="time-date" type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="field" />
        </div>
        <div>
          <label htmlFor="time-note" className="field-label text-xs">Note</label>
          <input id="time-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="field" />
        </div>
        <div className="col-span-2 flex justify-end">
          <button type="submit" className="btn-dark btn-sm" disabled={pending || !form.hours}>Ajouter</button>
        </div>
        {error && <p role="alert" className="field-error col-span-2">{error}</p>}
      </form>

      {optimistic.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-ink-muted">Détail des saisies ({optimistic.length})</summary>
          <ul className="mt-2 divide-y divide-line-soft text-xs">
            {optimistic.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-1">
                <span className="w-20">{formatDate(e.entry_date)}</span>
                <span className="flex-1">{TIME_TYPE_LABELS[e.type as TimeType]}{e.note && ` — ${e.note}`}{e.author_id && authors[e.author_id] && <span className="text-ink-muted"> · {authors[e.author_id]}</span>}</span>
                <span className="tabular-nums">{formatHours(Number(e.hours))}</span>
                {!e.id.startsWith("tmp-") && (
                  <button type="button" className="text-ink-muted hover:text-danger" aria-label="Supprimer la saisie" onClick={() => confirm("Supprimer cette saisie ?") && startTransition(async () => { await deleteTimeEntry(e.id); })}>✕</button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
