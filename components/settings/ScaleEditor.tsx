"use client";

import { useState, useTransition } from "react";
import { updateConsignmentScale } from "@/lib/actions/settings";
import { scaleLabels, type ScaleRow } from "@/lib/depot/scale";

type Row = { upTo: string; percent: string };
const num = (s: string) => Number(s.replace(/\s/g, "").replace(",", "."));

/** Éditeur du barème de partage affiché sur /depot et /salon. */
export function ScaleEditor({ scale }: { scale: ScaleRow[] }) {
  const [rows, setRows] = useState<Row[]>(scale.map((r) => ({ upTo: r.up_to === null ? "" : String(r.up_to), percent: String(r.percent) })));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const toScale = (list: Row[]): ScaleRow[] =>
    list.map((r, i) => ({ up_to: i === list.length - 1 ? null : num(r.upTo), percent: num(r.percent) }));
  const preview = (() => {
    try {
      return scaleLabels(toScale(rows));
    } catch {
      return [];
    }
  })();
  const set = (i: number, k: keyof Row, value: string) => setRows((list) => list.map((r, j) => (j === i ? { ...r, [k]: value } : r)));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const res = await updateConsignmentScale(toScale(rows));
          setMsg(res.ok ? { ok: true, text: "Barème enregistré ✓" } : { ok: false, text: res.error });
        });
      }}
    >
      <p className="text-sm text-ink-soft">Pourcentage du prix de vente final reversé au vendeur, par tranche. Affiché sur le formulaire de reprise.</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-muted">
            <th scope="col" className="pb-2 font-normal">Prix de vente jusqu&apos;à (exclu)</th>
            <th scope="col" className="pb-2 font-normal">Vendeur</th>
            <th scope="col" className="pb-2 font-normal">Affiché</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const last = i === rows.length - 1;
            return (
              <tr key={i} className="border-t border-line-soft">
                <td className="py-2 pr-2">
                  {last ? (
                    <span className="text-ink-muted">et plus</span>
                  ) : (
                    <input aria-label={`Borne de la tranche ${i + 1} (€)`} inputMode="numeric" value={r.upTo} onChange={(e) => set(i, "upTo", e.target.value)} className="field w-28" />
                  )}
                </td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-1">
                    <input aria-label={`Pourcentage de la tranche ${i + 1}`} inputMode="decimal" value={r.percent} onChange={(e) => set(i, "percent", e.target.value)} className="field w-20" />
                    <span>%</span>
                  </div>
                </td>
                <td className="py-2 pr-2 text-ink-soft">{preview[i]?.label}</td>
                <td className="py-2 text-right">
                  {rows.length > 1 && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setRows((list) => list.filter((_, j) => j !== i))}>
                      Retirer<span className="sr-only"> la tranche {i + 1}</span>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3">
        {rows.length < 10 && (
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setRows((list) => [...list.slice(0, -1), { upTo: "", percent: "" }, list[list.length - 1]])}
          >
            Ajouter une tranche
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={pending}>Enregistrer le barème</button>
        {msg && <span role="status" className={msg.ok ? "text-sm text-success" : "text-sm text-danger"}>{msg.text}</span>}
      </div>
    </form>
  );
}
