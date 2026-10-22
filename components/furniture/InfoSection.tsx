"use client";

import { useState, useTransition } from "react";
import { CATEGORY_LABELS, CONDITION_LABELS, type Category, type Condition } from "@/lib/labels";
import { formatEuro, formatNumber } from "@/lib/format";
import { updateFurnitureInfo } from "@/app/(app)/meubles/[id]/actions";
import type { Furniture } from "@/lib/types";

const OTHER = "__other";

type Props = {
  furniture: Pick<
    Furniture,
    | "id" | "name" | "category" | "brand_id" | "brand_other" | "designer" | "manufacture_year" | "description"
    | "width_cm" | "depth_cm" | "height_cm" | "materials" | "condition" | "defects" | "purchase_year"
    | "original_price" | "desired_price"
  >;
  brandName: string | null;
  brands: { id: string; name: string; active: boolean }[];
};

const toStr = (v: unknown) => (v === null || v === undefined ? "" : String(v));
function toNum(v: string) {
  const s = v.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function InfoSection({ furniture: f, brandName, brands }: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initial = {
    name: f.name,
    category: f.category,
    brand: f.brand_id ?? (f.brand_other ? OTHER : ""),
    brand_other: toStr(f.brand_other),
    designer: toStr(f.designer),
    manufacture_year: toStr(f.manufacture_year),
    description: f.description,
    width_cm: toStr(f.width_cm),
    depth_cm: toStr(f.depth_cm),
    height_cm: toStr(f.height_cm),
    materials: toStr(f.materials),
    condition: f.condition,
    defects: toStr(f.defects),
    purchase_year: toStr(f.purchase_year),
    original_price: toStr(f.original_price),
    desired_price: toStr(f.desired_price),
  };
  const [v, setV] = useState(initial);
  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateFurnitureInfo(f.id, {
        name: v.name,
        category: v.category,
        brand_id: v.brand && v.brand !== OTHER ? v.brand : null,
        brand_other: v.brand === OTHER ? v.brand_other : null,
        designer: v.designer,
        manufacture_year: v.manufacture_year,
        description: v.description,
        width_cm: toNum(v.width_cm),
        depth_cm: toNum(v.depth_cm),
        height_cm: toNum(v.height_cm),
        materials: v.materials,
        condition: v.condition,
        defects: v.defects,
        purchase_year: v.purchase_year,
        original_price: toNum(v.original_price),
        desired_price: toNum(v.desired_price),
      });
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  };

  if (!editing) {
    const dims = [f.width_cm, f.depth_cm, f.height_cm].some((d) => d !== null)
      ? `L ${formatNumber(f.width_cm)} × P ${formatNumber(f.depth_cm)} × H ${formatNumber(f.height_cm)} cm`
      : "—";
    const rows: [string, React.ReactNode][] = [
      ["Catégorie", CATEGORY_LABELS[f.category as Category]],
      ["Marque", brandName ? <>{brandName}{!f.brand_id && <span className="ml-2 text-xs text-ink-muted">(saisie libre)</span>}</> : "—"],
      ["Designer", f.designer || "—"],
      ["Année de fabrication", f.manufacture_year || "—"],
      ["Dimensions", dims],
      ["Matières / couleur", f.materials || "—"],
      ["État", CONDITION_LABELS[f.condition as Condition]],
      ["Défauts", f.defects || "—"],
      ["Année d'achat", f.purchase_year || "—"],
      ["Prix payé à l'origine", formatEuro(f.original_price)],
      ["Prix souhaité par le vendeur", formatEuro(f.desired_price)],
    ];
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button type="button" className="btn-secondary btn-sm" onClick={() => { setV(initial); setEditing(true); }}>Modifier</button>
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[180px_1fr]">
          {rows.map(([k, val]) => (
            <div key={k} className="contents">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="whitespace-pre-line">{val}</dd>
            </div>
          ))}
        </dl>
        <div>
          <h3 className="mb-1 text-sm text-ink-muted">Description du vendeur</h3>
          <p className="whitespace-pre-line text-sm">{f.description}</p>
        </div>
      </div>
    );
  }

  const input = (k: keyof typeof initial, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`info-${k}`} className="field-label">{label}</label>
      <input id={`info-${k}`} value={v[k]} onChange={set(k)} className="field" {...props} />
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-4">
      {input("name", "Nom / modèle", { required: true })}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="info-category" className="field-label">Catégorie</label>
          <select id="info-category" value={v.category} onChange={set("category")} className="field">
            {Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="info-brand" className="field-label">Marque</label>
          <select id="info-brand" value={v.brand} onChange={set("brand")} className="field">
            <option value="">Choisir…</option>
            {brands.filter((b) => b.active || b.id === f.brand_id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            <option value={OTHER}>Autre (saisie libre)</option>
          </select>
        </div>
      </div>
      {v.brand === OTHER && input("brand_other", "Marque (saisie libre)")}
      <div className="grid gap-4 sm:grid-cols-2">
        {input("designer", "Designer")}
        {input("manufacture_year", "Année de fabrication")}
      </div>
      <div>
        <label htmlFor="info-description" className="field-label">Description</label>
        <textarea id="info-description" rows={4} value={v.description} onChange={set("description")} className="field" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {input("width_cm", "Largeur (cm)", { inputMode: "decimal" })}
        {input("depth_cm", "Profondeur (cm)", { inputMode: "decimal" })}
        {input("height_cm", "Hauteur (cm)", { inputMode: "decimal" })}
      </div>
      {input("materials", "Matières / couleur")}
      <div>
        <label htmlFor="info-condition" className="field-label">État</label>
        <select id="info-condition" value={v.condition} onChange={set("condition")} className="field">
          {Object.entries(CONDITION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="info-defects" className="field-label">Défauts</label>
        <textarea id="info-defects" rows={3} value={v.defects} onChange={set("defects")} className="field" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {input("purchase_year", "Année d'achat")}
        {input("original_price", "Prix d'origine (€)", { inputMode: "decimal" })}
        {input("desired_price", "Prix souhaité (€)", { inputMode: "decimal" })}
      </div>
      {error && <p role="alert" className="field-error text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
