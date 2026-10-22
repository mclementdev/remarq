"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CopyButton } from "@/components/ui/CopyButton";
import { saveListing, updatePublication } from "@/lib/actions/listing";
import { formatDateTime, parisDay } from "@/lib/format";
import type { LbcListing, SiteListing } from "@/lib/ai/listing";

type Props = {
  furnitureId: string;
  site: SiteListing | null;
  lbc: LbcListing | null;
  publication: { published_site: boolean; published_site_at: string | null; published_lbc: boolean; published_lbc_at: string | null };
};

type Target = "both" | "site" | "lbc";

export function ListingSection({ furnitureId, site: initialSite, lbc: initialLbc, publication }: Props) {
  const router = useRouter();
  const [site, setSite] = useState(initialSite);
  const [lbc, setLbc] = useState(initialLbc);
  const [loading, setLoading] = useState<Target | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState({ site: "", lbc: "" });
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pub, setPub] = useState({
    published_site: publication.published_site,
    published_site_at: publication.published_site_at ?? parisDay(),
    published_lbc: publication.published_lbc,
    published_lbc_at: publication.published_lbc_at ?? parisDay(),
  });
  const [pubMsg, setPubMsg] = useState<string | null>(null);

  const generate = async (target: Target, consigne?: string) => {
    setLoading(target);
    setError(null);
    try {
      const res = await fetch(`/api/meubles/${furnitureId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, instruction: consigne || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "La génération a échoué.");
      if (body.listing_site) setSite(body.listing_site);
      if (body.listing_lbc) setLbc(body.listing_lbc);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "La génération a échoué.");
    } finally {
      setLoading(null);
    }
  };

  const save = (which: "site" | "lbc") =>
    startTransition(async () => {
      const res = await saveListing(furnitureId, which, which === "site" ? site : lbc);
      if (res.ok) {
        setSaved(which);
        setTimeout(() => setSaved(null), 2000);
      } else setError(res.error);
    });

  const regenerate = (which: "site" | "lbc") => (
    <div className="flex flex-wrap items-end gap-2 border-t border-line-soft pt-3">
      <div className="min-w-48 flex-1">
        <label htmlFor={`consigne-${which}`} className="field-label text-xs">Consigne (facultatif)</label>
        <input
          id={`consigne-${which}`}
          value={instruction[which]}
          onChange={(e) => setInstruction({ ...instruction, [which]: e.target.value })}
          placeholder="ex. plus court, insiste sur le cuir…"
          className="field"
        />
      </div>
      <button type="button" className="btn-secondary btn-sm" disabled={!!loading} onClick={() => generate(which, instruction[which])}>
        {loading === which ? "Génération…" : "Régénérer"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={!!loading} onClick={() => generate("both")}>
          {loading === "both" ? "Génération en cours…" : site || lbc ? "Régénérer les deux textes" : "Générer les textes"}
        </button>
        {loading && <span className="text-sm text-ink-muted" aria-live="polite">La rédaction prend généralement 20 à 60 secondes.</span>}
      </div>
      {error && <p role="alert" className="rounded-ui border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}

      {/* ---------------------------------------------- annonce site */}
      {site && (
        <article className={clsx("space-y-3 rounded-ui border border-line-soft p-4", loading && "opacity-60")} aria-label="Annonce site">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Annonce site</h3>
            <span className="text-[11px] text-ink-muted">{site.editedAt ? `modifiée le ${formatDateTime(site.editedAt)}` : `générée le ${formatDateTime(site.generatedAt)}`}</span>
          </div>
          <div>
            <label htmlFor="site-title" className="field-label text-xs">Titre</label>
            <input id="site-title" value={site.title} onChange={(e) => setSite({ ...site, title: e.target.value })} className="field" />
          </div>
          <div>
            <label htmlFor="site-body" className="field-label text-xs">Texte</label>
            <textarea id="site-body" rows={10} value={site.body} onChange={(e) => setSite({ ...site, body: e.target.value })} className="field" />
          </div>
          {site.missing.length > 0 && (
            <p className="rounded-ui bg-amber-50 p-2 text-xs text-amber-900">À compléter (non inventé par l&apos;IA) : {site.missing.join(", ")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={site.title} label="Copier le titre" />
            <CopyButton text={site.body} label="Copier le texte" />
            <CopyButton text={`${site.title}\n\n${site.body}`} label="Copier tout" className="btn-primary" />
            <button type="button" className="btn-dark btn-sm" disabled={pending} onClick={() => save("site")}>{saved === "site" ? "Enregistré ✓" : "Enregistrer"}</button>
          </div>
          {regenerate("site")}
        </article>
      )}

      {/* ---------------------------------------------- annonce Leboncoin */}
      {lbc && (
        <article className={clsx("space-y-3 rounded-ui border border-line-soft p-4", loading && "opacity-60")} aria-label="Annonce Leboncoin">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Annonce Leboncoin</h3>
            <span className="text-[11px] text-ink-muted">{lbc.editedAt ? `modifiée le ${formatDateTime(lbc.editedAt)}` : `générée le ${formatDateTime(lbc.generatedAt)}`}</span>
          </div>
          <div>
            <label htmlFor="lbc-title" className="field-label text-xs">
              Titre <span className={clsx(lbc.title.length > 70 ? "text-danger" : "text-ink-muted")}>({lbc.title.length}/70)</span>
            </label>
            <input id="lbc-title" maxLength={70} value={lbc.title} onChange={(e) => setLbc({ ...lbc, title: e.target.value })} className="field" />
          </div>
          <div>
            <label htmlFor="lbc-body" className="field-label text-xs">Description</label>
            <textarea id="lbc-body" rows={10} value={lbc.body} onChange={(e) => setLbc({ ...lbc, body: e.target.value })} className="field" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="lbc-category" className="field-label text-xs">Catégorie suggérée</label>
              <input id="lbc-category" value={lbc.category} onChange={(e) => setLbc({ ...lbc, category: e.target.value })} className="field" />
            </div>
            <div>
              <label htmlFor="lbc-price" className="field-label text-xs">Prix (€)</label>
              <input id="lbc-price" inputMode="decimal" value={lbc.price} onChange={(e) => setLbc({ ...lbc, price: e.target.value })} className="field" />
            </div>
            <div>
              <label htmlFor="lbc-keywords" className="field-label text-xs">Mots-clés</label>
              <input id="lbc-keywords" value={lbc.keywords} onChange={(e) => setLbc({ ...lbc, keywords: e.target.value })} className="field" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={lbc.title} label="Copier le titre" />
            <CopyButton text={lbc.body} label="Copier la description" />
            <CopyButton text={lbc.keywords} label="Copier les mots-clés" />
            <button type="button" className="btn-dark btn-sm" disabled={pending} onClick={() => save("lbc")}>{saved === "lbc" ? "Enregistré ✓" : "Enregistrer"}</button>
          </div>
          {regenerate("lbc")}
        </article>
      )}

      {/* ---------------------------------------------- publication */}
      <form
        className="space-y-3 rounded-ui bg-paper-alt p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPubMsg(null);
          startTransition(async () => {
            const res = await updatePublication(furnitureId, pub);
            setPubMsg(res.ok ? "Publication enregistrée ✓" : res.error);
          });
        }}
      >
        <h3 className="section-title">Publication</h3>
        {(["site", "lbc"] as const).map((k) => {
          const flag = `published_${k}` as const;
          const at = `published_${k}_at` as const;
          return (
            <div key={k} className="flex flex-wrap items-center gap-3">
              <label className="flex w-48 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={pub[flag]} onChange={(e) => setPub({ ...pub, [flag]: e.target.checked })} className="h-4 w-4 accent-ink" />
                Publié sur {k === "site" ? "le site" : "Leboncoin"}
              </label>
              {pub[flag] && (
                <label className="flex items-center gap-2 text-sm">
                  le
                  <input type="date" value={pub[at]} onChange={(e) => setPub({ ...pub, [at]: e.target.value })} className="field w-auto" aria-label={`Date de publication ${k === "site" ? "site" : "Leboncoin"}`} />
                </label>
              )}
            </div>
          );
        })}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-dark btn-sm" disabled={pending}>Enregistrer la publication</button>
          {pubMsg && <span className="text-sm" role="status">{pubMsg}</span>}
        </div>
      </form>
    </div>
  );
}
