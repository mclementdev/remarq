import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/storage";
import { getSettings } from "@/lib/settings";
import { marginFromRow } from "@/lib/calc/margin";
import { agingLabel } from "@/lib/calc/aging";
import { formatDate, formatEuro, parisDayBoundary } from "@/lib/format";
import { STATUSES, STATUS_LABELS, isStatus } from "@/lib/status";
import { CATEGORY_LABELS, MODE_LABELS } from "@/lib/labels";
import { ModeBadge, StatusBadge } from "@/components/ui/Badges";
import { Thumb } from "@/components/ui/Thumb";
import type { Database } from "@/lib/database.types";

export const metadata = { title: "Tous les meubles" };

const PAGE_SIZE = 25;
const SORTS = {
  created_at: "Date de création",
  status_changed_at: "Ancienneté dans le statut",
  sold_at: "Date de vente",
  final_sale_price: "Prix de vente",
  name: "Nom",
} as const;
type SortKey = keyof typeof SORTS;

type Search = Record<string, string | undefined>;
type Category = Database["public"]["Enums"]["furniture_category"];
type ModeEnum = Database["public"]["Enums"]["furniture_mode"];

/** Retire les caractères réservés de la syntaxe de filtre PostgREST. */
function sanitize(q: string) {
  return q.replace(/[,()*%\\]/g, " ").trim();
}

function buildHref(params: Search, patch: Search) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) next.set(k, v);
  const s = next.toString();
  return s ? `/meubles?${s}` : "/meubles";
}

export default async function MeublesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [settings, { data: brands }] = await Promise.all([
    getSettings(supabase),
    supabase.from("brands").select("id, name").order("name"),
  ]);

  const page = Math.max(1, Number(params.page) || 1);
  const sort: SortKey = params.tri && params.tri in SORTS ? (params.tri as SortKey) : "created_at";
  const ascending = params.ordre === "asc";

  let query = supabase.from("furniture_overview").select("*", { count: "exact" });

  const q = sanitize(params.q ?? "");
  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `name.ilike.${like},brand_name.ilike.${like},seller_first_name.ilike.${like},seller_last_name.ilike.${like}`,
    );
  }
  if (params.statut && isStatus(params.statut)) query = query.eq("status", params.statut);
  if (params.marque) query = query.eq("brand_id", params.marque);
  if (params.categorie && params.categorie in CATEGORY_LABELS) query = query.eq("category", params.categorie as Category);
  if (params.mode === "aucun") query = query.is("mode", null);
  else if (params.mode && params.mode in MODE_LABELS) query = query.eq("mode", params.mode as ModeEnum);
  if (params.du && /^\d{4}-\d{2}-\d{2}$/.test(params.du)) query = query.gte("created_at", parisDayBoundary(params.du, "start"));
  if (params.au && /^\d{4}-\d{2}-\d{2}$/.test(params.au)) query = query.lte("created_at", parisDayBoundary(params.au, "end"));
  if (params.vendu === "oui") query = query.not("sold_at", "is", null);
  if (params.vendu === "non") query = query.is("sold_at", null);

  query = query
    .order(sort, { ascending, nullsFirst: false })
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: rows, count, error } = await query;
  const thumbs = await signPaths(supabase, (rows ?? []).map((r) => r.thumb_path));
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const sortHeader = (key: SortKey, label: string) => {
    const active = sort === key;
    const nextOrder = active && !ascending ? "asc" : "desc";
    return (
      <Link href={buildHref(params, { tri: key, ordre: nextOrder, page: undefined })} className="inline-flex items-center gap-1 hover:underline">
        {label}
        {active && <span aria-hidden>{ascending ? "↑" : "↓"}</span>}
      </Link>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">Tous les meubles</h1>
        <p className="text-sm text-ink-muted">{total} meuble{total > 1 ? "s" : ""}</p>
      </div>

      <form method="get" className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8" role="search">
        <div className="md:col-span-2">
          <label htmlFor="q" className="field-label">Recherche</label>
          <input id="q" name="q" defaultValue={params.q} placeholder="Nom, marque, vendeur…" className="field" />
        </div>
        <div>
          <label htmlFor="statut" className="field-label">Statut</label>
          <select id="statut" name="statut" defaultValue={params.statut ?? ""} className="field">
            <option value="">Tous</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="marque" className="field-label">Marque</label>
          <select id="marque" name="marque" defaultValue={params.marque ?? ""} className="field">
            <option value="">Toutes</option>
            {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="categorie" className="field-label">Catégorie</label>
          <select id="categorie" name="categorie" defaultValue={params.categorie ?? ""} className="field">
            <option value="">Toutes</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mode" className="field-label">Mode</label>
          <select id="mode" name="mode" defaultValue={params.mode ?? ""} className="field">
            <option value="">Tous</option>
            <option value="buyout">Rachat</option>
            <option value="consignment">Dépôt-vente</option>
            <option value="aucun">Non défini</option>
          </select>
        </div>
        <div>
          <label htmlFor="vendu" className="field-label">Vente</label>
          <select id="vendu" name="vendu" defaultValue={params.vendu ?? ""} className="field">
            <option value="">Tous</option>
            <option value="oui">Vendus</option>
            <option value="non">Non vendus</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-2 xl:col-span-2">
          <div>
            <label htmlFor="du" className="field-label">Créé du</label>
            <input id="du" name="du" type="date" defaultValue={params.du} className="field" />
          </div>
          <div>
            <label htmlFor="au" className="field-label">au</label>
            <input id="au" name="au" type="date" defaultValue={params.au} className="field" />
          </div>
        </div>
        <input type="hidden" name="tri" value={params.tri ?? ""} />
        <input type="hidden" name="ordre" value={params.ordre ?? ""} />
        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6 xl:justify-end">
          <Link href="/meubles" className="btn-ghost">Réinitialiser</Link>
          <button type="submit" className="btn-dark">Filtrer</button>
        </div>
      </form>

      {error && <p role="alert" className="text-danger">Erreur de chargement : {error.message}</p>}

      <div className="overflow-x-auto rounded-ui border border-line-soft">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-paper-alt text-left text-xs uppercase tracking-button text-ink-soft">
            <tr>
              <th scope="col" className="w-14 px-3 py-2"><span className="sr-only">Photo</span></th>
              <th scope="col" className="px-3 py-2">{sortHeader("name", "Nom")}</th>
              <th scope="col" className="px-3 py-2">Marque</th>
              <th scope="col" className="px-3 py-2">Catégorie</th>
              <th scope="col" className="px-3 py-2">Mode</th>
              <th scope="col" className="px-3 py-2">Statut</th>
              <th scope="col" className="px-3 py-2">{sortHeader("status_changed_at", "Ancienneté")}</th>
              <th scope="col" className="px-3 py-2">{sortHeader("created_at", "Créé le")}</th>
              <th scope="col" className="px-3 py-2">{sortHeader("sold_at", "Vendu le")}</th>
              <th scope="col" className="px-3 py-2 text-right">{sortHeader("final_sale_price", "Prix de vente")}</th>
              <th scope="col" className="px-3 py-2 text-right">Marge</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => {
              const margin = marginFromRow(r, settings.hourly_rate)?.margin ?? null;
              const href = `/meubles/${r.id}`;
              return (
                <tr key={r.id} className="group relative border-t border-line-soft hover:bg-paper-alt">
                  <td className="px-3 py-2"><Thumb src={r.thumb_path ? thumbs[r.thumb_path] : null} alt="" size={40} /></td>
                  <td className="px-3 py-2">
                    <Link href={href} className="font-medium after:absolute after:inset-0 hover:underline">
                      {(r.quantity ?? 1) > 1 && <span className="mr-1 text-accent">×{r.quantity}</span>}
                      {r.name}
                    </Link>
                    <div className="text-xs text-ink-muted">
                      {[r.seller_first_name, r.seller_last_name].filter(Boolean).join(" ")}
                      {(r.submission_size ?? 0) > 1 && ` · pièce ${r.item_index}/${r.submission_size}`}
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.brand_name}</td>
                  <td className="px-3 py-2">{r.category ? CATEGORY_LABELS[r.category] : "—"}</td>
                  <td className="px-3 py-2"><ModeBadge mode={r.mode} /></td>
                  <td className="px-3 py-2">{r.status && <StatusBadge status={r.status} />}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{r.status_changed_at && agingLabel(r.status_changed_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(r.created_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(r.sold_at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">{formatEuro(r.final_sale_price)}</td>
                  <td className={clsx("whitespace-nowrap px-3 py-2 text-right", margin !== null && margin < 0 && "text-danger")}>{formatEuro(margin)}</td>
                </tr>
              );
            })}
            {!rows?.length && (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-ink-muted">Aucun meuble ne correspond à ces critères.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          {page > 1 ? <Link className="btn-secondary btn-sm" href={buildHref(params, { page: String(page - 1) })}>Précédent</Link> : <span className="btn-secondary btn-sm opacity-40">Précédent</span>}
          <span className="px-3 text-sm">Page {page} / {pages}</span>
          {page < pages ? <Link className="btn-secondary btn-sm" href={buildHref(params, { page: String(page + 1) })}>Suivant</Link> : <span className="btn-secondary btn-sm opacity-40">Suivant</span>}
        </nav>
      )}
    </div>
  );
}
