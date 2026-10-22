"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { FLOOR_LABELS } from "@/lib/labels";
import { accessText, sellerAddress } from "@/lib/furniture";
import { updateSeller } from "@/app/(app)/meubles/[id]/actions";
import type { Furniture } from "@/lib/types";

type Props = {
  furniture: Pick<
    Furniture,
    | "id" | "seller_first_name" | "seller_last_name" | "seller_email" | "seller_phone" | "seller_street"
    | "seller_postal_code" | "seller_city" | "floor" | "has_elevator" | "access_notes"
  >;
};

export function SellerSection({ furniture: f }: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initial = {
    seller_first_name: f.seller_first_name,
    seller_last_name: f.seller_last_name,
    seller_email: f.seller_email,
    seller_phone: f.seller_phone,
    seller_street: f.seller_street,
    seller_postal_code: f.seller_postal_code,
    seller_city: f.seller_city,
    floor: f.floor ?? "",
    has_elevator: f.has_elevator === null ? "" : f.has_elevator ? "yes" : "no",
    access_notes: f.access_notes ?? "",
  };
  const [v, setV] = useState(initial);
  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const address = sellerAddress(f);
  const access = accessText(f);

  if (!editing) {
    return (
      <div className="space-y-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base">{f.seller_first_name} {f.seller_last_name}</p>
          <button type="button" className="btn-secondary btn-sm" onClick={() => { setV(initial); setEditing(true); }}>Modifier</button>
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2">
          <dt className="text-ink-muted">E-mail</dt>
          <dd className="break-all"><a href={`mailto:${f.seller_email}`} className="underline">{f.seller_email}</a></dd>
          <dt className="text-ink-muted">Téléphone</dt>
          <dd><a href={`tel:${f.seller_phone.replace(/[^+0-9]/g, "")}`} className="underline">{f.seller_phone}</a></dd>
          <dt className="text-ink-muted">Adresse</dt>
          <dd>{address}</dd>
          <dt className="text-ink-muted">Accès</dt>
          <dd>{access || "—"}</dd>
        </dl>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={address} label="Copier l'adresse" />
          <CopyButton text={f.seller_email} label="Copier l'e-mail" />
          <a href={`tel:${f.seller_phone.replace(/[^+0-9]/g, "")}`} className="btn-secondary btn-sm">Appeler</a>
        </div>
      </div>
    );
  }

  const input = (k: keyof typeof initial, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`seller-${k}`} className="field-label">{label}</label>
      <input id={`seller-${k}`} value={v[k]} onChange={set(k)} className="field" {...props} />
    </div>
  );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await updateSeller(f.id, {
            ...v,
            floor: v.floor || null,
            has_elevator: v.has_elevator === "" ? null : v.has_elevator === "yes",
          });
          if (res.ok) setEditing(false);
          else setError(res.error);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {input("seller_first_name", "Prénom")}
        {input("seller_last_name", "Nom")}
      </div>
      {input("seller_email", "E-mail", { type: "email" })}
      {input("seller_phone", "Téléphone", { type: "tel" })}
      {input("seller_street", "Rue")}
      <div className="grid grid-cols-[2fr_3fr] gap-3">
        {input("seller_postal_code", "Code postal")}
        {input("seller_city", "Ville")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="seller-floor" className="field-label">Étage</label>
          <select id="seller-floor" value={v.floor} onChange={set("floor")} className="field">
            <option value="">Non précisé</option>
            {Object.entries(FLOOR_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="seller-elevator" className="field-label">Ascenseur</label>
          <select id="seller-elevator" value={v.has_elevator} onChange={set("has_elevator")} className="field">
            <option value="">Non précisé</option>
            <option value="yes">Oui</option>
            <option value="no">Non</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="seller-access" className="field-label">Précisions d&apos;accès</label>
        <textarea id="seller-access" rows={2} value={v.access_notes} onChange={set("access_notes")} className="field" />
      </div>
      {error && <p role="alert" className="field-error text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
