"use client";

import { useState, useTransition } from "react";
import { updateConformity } from "@/lib/actions/listing";
import { NON_CONFORM_CHOICE_LABELS, type NonConformChoice } from "@/lib/labels";
import { formatDate, formatEuro } from "@/lib/format";

type Props = {
  furnitureId: string;
  report: string | null;
  choice: string | null;
  returnQuote: number | null;
  counter: { label: string; deadline: string; expired: boolean } | null;
  gallery: React.ReactNode;
};

export function ConformitySection({ furnitureId, report, choice, returnQuote, counter, gallery }: Props) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState({ report: report ?? "", choice: choice ?? "", quote: returnQuote === null ? "" : String(returnQuote) });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {counter && (
        <p className={counter.expired ? "rounded-ui bg-red-50 p-2 text-sm text-danger" : "rounded-ui bg-paper-alt p-2 text-sm"}>
          Délai client : {counter.label} — date limite le {formatDate(counter.deadline)}{counter.expired && " (dépassée)"}
        </p>
      )}
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const q = v.quote.replace(/\s/g, "").replace(",", ".");
            startTransition(async () => {
              const res = await updateConformity(furnitureId, {
                conformity_report: v.report,
                non_conform_choice: v.choice || null,
                return_quote: q ? Number(q) : null,
              });
              if (res.ok) setEditing(false);
              else setError(res.error);
            });
          }}
        >
          <div>
            <label htmlFor="conf-report" className="field-label">Constat</label>
            <textarea id="conf-report" rows={3} value={v.report} onChange={(e) => setV({ ...v, report: e.target.value })} className="field" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="conf-choice" className="field-label">Décision du client</label>
              <select id="conf-choice" value={v.choice} onChange={(e) => setV({ ...v, choice: e.target.value })} className="field">
                <option value="">Pas encore connue</option>
                {Object.entries(NON_CONFORM_CHOICE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="conf-quote" className="field-label">Devis retour (€)</label>
              <input id="conf-quote" inputMode="decimal" value={v.quote} onChange={(e) => setV({ ...v, quote: e.target.value })} className="field" />
            </div>
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>Annuler</button>
            <button type="submit" className="btn-primary btn-sm" disabled={pending}>Enregistrer</button>
          </div>
        </form>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-line">{report || <span className="text-ink-muted">Aucun constat.</span>}</p>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Modifier</button>
          </div>
          <p><span className="text-ink-muted">Décision : </span>{choice ? NON_CONFORM_CHOICE_LABELS[choice as NonConformChoice] : "—"}</p>
          <p><span className="text-ink-muted">Devis retour : </span>{formatEuro(returnQuote)}</p>
        </div>
      )}
      <div>
        <h3 className="mb-2 text-sm text-ink-muted">Photos de conformité</h3>
        {gallery}
      </div>
    </div>
  );
}
