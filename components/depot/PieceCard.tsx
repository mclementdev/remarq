"use client";

import clsx from "clsx";
import { PhotoTile, type PhotoItem } from "./PhotoTile";
import { PhotoDrop } from "./PhotoDrop";
import { Field, aria, ErrorText, Req } from "./Field";
import type { PieceState } from "./types";
import { depotContent } from "@/lib/content/depot";
import { CATEGORY_LABELS } from "@/lib/labels";
import { itemTypesByCategory } from "@/lib/depot/item-types";
import { SCORE_MARKS, scoreLabel } from "@/lib/depot/condition";
import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/validation/depot";

const c = depotContent.pieces;
const TYPE_GROUPS = itemTypesByCategory();

type Props = {
  index: number;
  piece: PieceState;
  brandListId: string;
  errors: Record<string, string>;
  canRemove: boolean;
  onChange: (patch: Partial<PieceState>) => void;
  onRemove: () => void;
  onAddPhotos: (files: File[]) => void;
  onRetryPhoto: (item: PhotoItem) => void;
  onRemovePhoto: (key: string) => void;
};

export function PieceCard({ index, piece: p, brandListId, errors, canRemove, onChange, onRemove, onAddPhotos, onRetryPhoto, onRemovePhoto }: Props) {
  const n = index + 1;
  const id = (name: string) => `piece-${index}-${name}`;
  const err = (name: string) => errors[`pieces.${index}.${name}`];
  const text = (name: "brand" | "model" | "purchaseYear" | "originalPrice") => ({
    value: p[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [name]: e.target.value }),
  });
  const remaining = MAX_PHOTOS - p.photos.length;

  return (
    <section aria-labelledby={id("title")} className="rounded-ui border border-line bg-paper">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:px-5">
        <h3 id={id("title")} className="text-base">Pièce {n}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className="btn-ghost btn-sm">
            Retirer<span className="sr-only"> la pièce {n}</span>
          </button>
        )}
      </header>

      <div className="space-y-8 p-4 sm:p-5">
        {/* -------------------------------------------------- Identité */}
        <fieldset className="space-y-5">
          <legend className="mb-4 font-bold">Identité</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={id("brand")} label="Marque ou designer" required hint={c.brandHint} error={err("brand")}>
              <input {...aria(id("brand"), err("brand"), `${id("brand")}-hint`)} list={brandListId} autoComplete="off" placeholder={c.brandPlaceholder} {...text("brand")} />
            </Field>
            <Field id={id("model")} label="Modèle" optional>
              <input {...aria(id("model"))} placeholder={c.modelPlaceholder} {...text("model")} />
            </Field>
            <Field id={id("itemType")} label="Type de pièce" required error={err("itemType")}>
              <select {...aria(id("itemType"), err("itemType"))} value={p.itemType} onChange={(e) => onChange({ itemType: e.target.value })}>
                <option value="">Choisir…</option>
                {TYPE_GROUPS.map((g) => (
                  <optgroup key={g.category} label={CATEGORY_LABELS[g.category]}>
                    {g.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field id={id("quantity")} label="Quantité" required error={err("quantity")}>
              <input {...aria(id("quantity"), err("quantity"))} type="number" inputMode="numeric" min={1} max={99} step={1} value={p.quantity} onChange={(e) => onChange({ quantity: e.target.value })} />
            </Field>
          </div>
          <Field id={id("description")} label="Description" required error={err("description")}>
            <textarea {...aria(id("description"), err("description"))} rows={4} placeholder={c.descriptionPlaceholder} value={p.description} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={id("purchaseYear")} label="Année d'achat" optional="approx.">
              <input {...aria(id("purchaseYear"))} placeholder={c.yearPlaceholder} {...text("purchaseYear")} />
            </Field>
            <Field id={id("originalPrice")} label="Prix payé" optional="€, approx." hint={c.priceHint} error={err("originalPrice")}>
              <input {...aria(id("originalPrice"), err("originalPrice"), `${id("originalPrice")}-hint`)} inputMode="decimal" placeholder={c.pricePlaceholder} {...text("originalPrice")} />
            </Field>
          </div>
        </fieldset>

        {/* -------------------------------------------------- État */}
        <fieldset className="space-y-5 border-t border-line-soft pt-6">
          <legend className="sr-only">État</legend>
          <p aria-hidden className="font-bold">État</p>
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor={id("conditionScore")} className="field-label mb-0">Note d&apos;état</label>
              <p className="text-sm text-ink-soft" aria-hidden>
                <span className="text-lg font-bold text-ink">{p.conditionScore}</span> / 10 · {scoreLabel(p.conditionScore)}
              </p>
            </div>
            <input
              id={id("conditionScore")}
              type="range"
              min={0}
              max={10}
              step={1}
              value={p.conditionScore}
              onChange={(e) => onChange({ conditionScore: Number(e.target.value) })}
              aria-valuetext={`${p.conditionScore} sur 10, ${scoreLabel(p.conditionScore)}`}
              className="w-full accent-ink"
            />
            <div aria-hidden className="mt-1 flex justify-between text-xs text-ink-soft">
              {SCORE_MARKS.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
          <Field id={id("conditionDetails")} label="Détails sur l'état" optional>
            <textarea {...aria(id("conditionDetails"))} rows={3} placeholder={c.conditionDetailsPlaceholder} value={p.conditionDetails} onChange={(e) => onChange({ conditionDetails: e.target.value })} />
          </Field>
        </fieldset>

        {/* -------------------------------------------------- Photos */}
        <fieldset className="space-y-3 border-t border-line-soft pt-6">
          <legend className="sr-only">Photos de la pièce {n}</legend>
          <p aria-hidden className="field-label">Photos<Req /></p>
          {p.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {p.photos.map((item, i) => (
                <PhotoTile
                  key={item.key}
                  label={i === 0 ? "Principale" : `Photo ${i + 1}`}
                  item={item}
                  onSelect={() => {}}
                  onRetry={() => onRetryPhoto(item)}
                  onRemove={() => onRemovePhoto(item.key)}
                />
              ))}
            </div>
          )}
          {remaining > 0 && (
            <PhotoDrop
              label={p.photos.length ? "Ajouter d'autres photos" : "Ajouter des photos"}
              invalid={!!err("photos")}
              describedBy={[`${id("photos")}-hint`, err("photos") ? `${id("photos")}-error` : null].filter(Boolean).join(" ")}
              onFiles={(files) => onAddPhotos(files.slice(0, remaining))}
            />
          )}
          <ul className="flex flex-wrap gap-2" aria-label="Photos conseillées">
            {c.photoTips.map((t) => <li key={t} className="rounded-full bg-paper-alt px-3 py-1 text-sm">{t}</li>)}
          </ul>
          <p id={`${id("photos")}-hint`} className="field-hint">
            {c.photoHint} {MIN_PHOTOS} minimum, {MAX_PHOTOS} maximum.
          </p>
          <p className={clsx("text-sm", p.photos.length < MIN_PHOTOS ? "text-ink-soft" : "text-success")} aria-live="polite">
            {p.photos.length} / {MAX_PHOTOS} photo{p.photos.length > 1 ? "s" : ""}
            {p.photos.length < MIN_PHOTOS && ` — encore ${MIN_PHOTOS - p.photos.length} minimum`}
          </p>
          <ErrorText id={id("photos")} error={err("photos")} />
        </fieldset>
      </div>
    </section>
  );
}
