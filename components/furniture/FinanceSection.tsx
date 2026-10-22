"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { addFinanceLine, deleteFinanceLine, updateFinances } from "@/lib/actions/finance";
import { computeMargin } from "@/lib/calc/margin";
import { formatDate, formatEuro, formatPercent, parisDay } from "@/lib/format";
import { FINANCE_CATEGORY_LABELS, MODE_LONG_LABELS, type FinanceCategory } from "@/lib/labels";
import type { FinanceLine } from "@/lib/types";

type Finances = {
  mode: "buyout" | "consignment" | null;
  original_price: number | null;
  desired_price: number | null;
  offer_buyout_price: number | null;
  expected_sale_price: number | null;
  transport_cost: number | null;
  final_buyout_price: number | null;
  consignment_commission: number | null;
  consignment_terms: string | null;
  listed_price: number | null;
  final_sale_price: number | null;
};

type Props = {
  furnitureId: string;
  finances: Finances;
  lines: FinanceLine[];
  hoursTotal: number;
  hourlyRate: number;
};

const EDITABLE = [
  ["offer_buyout_price", "Prix de rachat proposé"],
  ["expected_sale_price", "Prix de vente espéré"],
  ["transport_cost", "Coût de transport d'enlèvement"],
  ["final_buyout_price", "Prix de rachat final"],
  ["consignment_commission", "Commission dépôt-vente"],
  ["listed_price", "Prix affiché"],
  ["final_sale_price", "Prix de vente final"],
] as const;

const toStr = (v: number | null) => (v === null ? "" : String(v));
function toNum(v: string) {
  const s = v.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function FinanceSection({ furnitureId, finances: f, lines, hoursTotal, hourlyRate }: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initial = {
    mode: f.mode ?? "",
    consignment_terms: f.consignment_terms ?? "",
    ...Object.fromEntries(EDITABLE.map(([k]) => [k, toStr(f[k])])),
  } as Record<string, string>;
  const [v, setV] = useState(initial);
  const [line, setLine] = useState({ label: "", sign: "-1", amount: "", category: "extra_cost", line_date: parisDay() });
  const [lineError, setLineError] = useState<string | null>(null);

  const adjustmentsTotal = lines.reduce((sum, l) => sum + Number(l.amount), 0);
  const margin = computeMargin({
    mode: f.mode,
    finalSalePrice: f.final_sale_price,
    finalBuyoutPrice: f.final_buyout_price,
    consignmentCommission: f.consignment_commission,
    adjustmentsTotal,
    hoursTotal,
    hourlyRate,
  });
  const commissionBase = f.final_sale_price ?? f.listed_price ?? f.expected_sale_price;
  const commissionPct = f.consignment_commission !== null && commissionBase ? f.consignment_commission / commissionBase : null;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ champs de base */}
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const res = await updateFinances(furnitureId, {
                mode: v.mode || null,
                consignment_terms: v.consignment_terms,
                ...Object.fromEntries(EDITABLE.map(([k]) => [k, toNum(v[k])])),
              });
              if (res.ok) setEditing(false);
              else setError(res.error);
            });
          }}
        >
          <div>
            <label htmlFor="fin-mode" className="field-label">Mode</label>
            <select id="fin-mode" value={v.mode} onChange={(e) => setV({ ...v, mode: e.target.value })} className="field">
              <option value="">Non défini</option>
              {Object.entries(MODE_LONG_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {EDITABLE.map(([k, label]) => (
              <div key={k}>
                <label htmlFor={`fin-${k}`} className="field-label text-xs">{label} (€)</label>
                <input id={`fin-${k}`} inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className="field" />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="fin-terms" className="field-label">Conditions dépôt-vente</label>
            <textarea id="fin-terms" rows={2} value={v.consignment_terms} onChange={(e) => setV({ ...v, consignment_terms: e.target.value })} className="field" />
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>Annuler</button>
            <button type="submit" className="btn-primary btn-sm" disabled={pending}>Enregistrer</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm">Mode : <strong className="font-medium">{f.mode ? MODE_LONG_LABELS[f.mode] : "non défini"}</strong></p>
            <button type="button" className="btn-secondary btn-sm" onClick={() => { setV(initial); setEditing(true); }}>Modifier</button>
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-muted">Prix payé à l&apos;origine (info vendeur)</dt><dd className="text-right">{formatEuro(f.original_price)}</dd>
            <dt className="text-ink-muted">Prix souhaité par le vendeur</dt><dd className="text-right">{formatEuro(f.desired_price)}</dd>
            {EDITABLE.map(([k, label]) => (
              <div key={k} className="contents">
                <dt className="text-ink-muted">{label}{k === "transport_cost" && <span className="block text-[11px]">à la charge du vendeur, hors marge</span>}</dt>
                <dd className="text-right">
                  {formatEuro(f[k], { cents: true })}
                  {k === "consignment_commission" && commissionPct !== null && <span className="ml-1 text-xs text-ink-muted">({formatPercent(commissionPct)})</span>}
                </dd>
              </div>
            ))}
          </dl>
          {f.consignment_terms && <p className="whitespace-pre-line rounded-ui bg-paper-alt p-2 text-xs">{f.consignment_terms}</p>}
        </div>
      )}

      {/* ------------------------------------------------ lignes d'ajustement */}
      <div>
        <h3 className="mb-2 text-sm text-ink-muted">Lignes d&apos;ajustement</h3>
        <ul className="divide-y divide-line-soft text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-2 py-1.5">
              <span className="flex-1">
                {l.label}
                <span className="ml-2 text-xs text-ink-muted">{FINANCE_CATEGORY_LABELS[l.category as FinanceCategory]} · {formatDate(l.line_date)}</span>
              </span>
              <span className={clsx("whitespace-nowrap", Number(l.amount) < 0 ? "text-danger" : "text-success")}>
                {formatEuro(l.amount, { cents: true, signed: true })}
              </span>
              <button
                type="button"
                className="text-xs text-ink-muted hover:text-danger"
                aria-label={`Supprimer la ligne ${l.label}`}
                onClick={() => confirm(`Supprimer la ligne « ${l.label} » ?`) && startTransition(async () => { await deleteFinanceLine(l.id); })}
              >
                ✕
              </button>
            </li>
          ))}
          {!lines.length && <li className="py-1.5 text-ink-muted">Aucune ligne.</li>}
        </ul>
        <form
          className="mt-3 grid grid-cols-2 gap-2 rounded-ui bg-paper-alt p-3 sm:grid-cols-[1fr_auto_100px]"
          onSubmit={(e) => {
            e.preventDefault();
            setLineError(null);
            const n = toNum(line.amount);
            startTransition(async () => {
              const res = await addFinanceLine(furnitureId, {
                label: line.label,
                amount: n === null ? NaN : Math.abs(n) * Number(line.sign),
                category: line.category,
                line_date: line.line_date,
              });
              if (!res.ok) setLineError(res.error);
              else setLine({ ...line, label: "", amount: "" });
            });
          }}
        >
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="line-label" className="sr-only">Libellé</label>
            <input id="line-label" placeholder="Libellé (ex. produit de nettoyage)" value={line.label} onChange={(e) => setLine({ ...line, label: e.target.value })} className="field" />
          </div>
          <div className="flex rounded-ui border border-line bg-paper" role="radiogroup" aria-label="Sens">
            {[["-1", "Dépense"], ["1", "Gain"]].map(([s, l]) => (
              <label key={s} className={clsx("flex cursor-pointer items-center px-2.5 text-xs", line.sign === s && (s === "-1" ? "bg-danger text-paper" : "bg-success text-paper"))}>
                <input type="radio" name="line-sign" value={s} checked={line.sign === s} onChange={() => setLine({ ...line, sign: s })} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
          <div>
            <label htmlFor="line-amount" className="sr-only">Montant (€)</label>
            <input id="line-amount" inputMode="decimal" placeholder="€" value={line.amount} onChange={(e) => setLine({ ...line, amount: e.target.value })} className="field" />
          </div>
          <div>
            <label htmlFor="line-category" className="sr-only">Catégorie</label>
            <select id="line-category" value={line.category} onChange={(e) => setLine({ ...line, category: e.target.value })} className="field">
              {Object.entries(FINANCE_CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="line-date" className="sr-only">Date</label>
            <input id="line-date" type="date" value={line.line_date} onChange={(e) => setLine({ ...line, line_date: e.target.value })} className="field" />
          </div>
          <button type="submit" className="btn-dark btn-sm self-center" disabled={pending}>Ajouter</button>
          {lineError && <p role="alert" className="field-error col-span-full">{lineError}</p>}
        </form>
      </div>

      {/* ------------------------------------------------ marge */}
      <div>
        <h3 className="mb-2 text-sm text-ink-muted">
          {margin?.mode === "consignment" ? "Recette (dépôt-vente)" : "Marge"}
          <span className="ml-1 text-xs">— informatif</span>
        </h3>
        {!margin ? (
          <p className="text-sm text-ink-muted">Le mode (rachat ou dépôt-vente) n&apos;est pas encore connu.</p>
        ) : (
          <>
            <table className="w-full text-sm" aria-label="Détail du calcul">
              <tbody>
                {margin.lines.map((l) => (
                  <tr key={l.label} className={clsx(l.kind === "total" && "border-t border-line font-medium", l.kind === "info" && "border-t border-dashed border-line text-ink-soft")}>
                    <td className="py-1">
                      {l.label}
                      {l.detail && <span className="block text-[11px] text-ink-muted">{l.detail}</span>}
                    </td>
                    <td className={clsx("py-1 text-right", l.kind === "total" && l.amount < 0 && "text-danger")}>{formatEuro(l.amount, { cents: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {margin.missing.length > 0 && (
              <p className="mt-2 text-xs text-amber-800">Calcul incomplet : {margin.missing.join(", ")} à renseigner.</p>
            )}
            {hourlyRate === 0 && (
              <p className="mt-1 text-xs text-ink-muted">Taux horaire à 0 € (Réglages) : le temps passé n&apos;est pas valorisé.</p>
            )}
            {margin.mode === "buyout" && (
              <p className="mt-1 text-xs text-ink-muted">Marge retenue au dashboard : {hourlyRate > 0 ? "nette" : "brute"}.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
