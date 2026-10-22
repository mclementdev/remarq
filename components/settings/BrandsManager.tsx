"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { acceptSuggestion, addBrand, deleteBrand, dismissSuggestion, renameBrand, setBrandActive } from "@/lib/actions/settings";

type Brand = { id: string; name: string; active: boolean; usage: number };
type Suggestion = { id: string; label: string; count: number };

export function BrandsManager({ brands, suggestions }: { brands: Brand[]; suggestions: Suggestion[] }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Erreur.");
      else after?.();
    });

  return (
    <div className="space-y-6">
      {suggestions.length > 0 && (
        <div className="rounded-ui border border-accent bg-accent/5 p-4">
          <h3 className="mb-2 text-sm font-medium">Suggestions à valider (saisies via « Autre » dans le formulaire)</h3>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex-1">{s.label} <span className="text-xs text-ink-muted">({s.count} meuble{s.count > 1 ? "s" : ""})</span></span>
                <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => run(() => acceptSuggestion(s.id))}>Ajouter à la liste</button>
                <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => dismissSuggestion(s.id))}>Ignorer</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => addBrand(name), () => setName("")); }}>
        <label htmlFor="new-brand" className="sr-only">Nouvelle marque</label>
        <input id="new-brand" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle marque" className="field" />
        <button type="submit" className="btn-dark" disabled={pending || !name.trim()}>Ajouter</button>
      </form>
      {error && <p role="alert" className="field-error text-sm">{error}</p>}

      <ul className="divide-y divide-line-soft rounded-ui border border-line-soft text-sm">
        {brands.map((b) => (
          <li key={b.id} className={clsx("flex flex-wrap items-center gap-2 px-3 py-2", !b.active && "bg-paper-alt text-ink-muted")}>
            {editing?.id === b.id ? (
              <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); run(() => renameBrand(b.id, editing.name), () => setEditing(null)); }}>
                <label htmlFor={`rename-${b.id}`} className="sr-only">Nouveau nom</label>
                <input id={`rename-${b.id}`} autoFocus value={editing.name} onChange={(e) => setEditing({ id: b.id, name: e.target.value })} className="field" />
                <button type="submit" className="btn-primary btn-sm">OK</button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(null)}>Annuler</button>
              </form>
            ) : (
              <>
                <span className="flex-1">{b.name}{!b.active && " (désactivée)"} <span className="text-xs text-ink-muted">· {b.usage} meuble{b.usage > 1 ? "s" : ""}</span></span>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing({ id: b.id, name: b.name })}>Renommer</button>
                <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setBrandActive(b.id, !b.active))}>{b.active ? "Désactiver" : "Réactiver"}</button>
                <button type="button" className="btn-ghost btn-sm text-danger" disabled={pending} onClick={() => confirm(`Supprimer « ${b.name} » ?`) && run(() => deleteBrand(b.id))}>Supprimer</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
