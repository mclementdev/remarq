import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { acceptanceRate, delta, immobilizedStock, last12Months, monthLabel, monthStats, shiftMonth, type DashboardRow } from "@/lib/calc/dashboard";
import { formatEuro, formatLongDate, formatNumber, formatPercent, parisDay } from "@/lib/format";
import { ARCHIVE_STATUSES, KANBAN_COLUMNS, STATUS_SHORT_LABELS, type FurnitureStatus } from "@/lib/status";
import { APPOINTMENT_TYPE_LABELS, PERIOD_LABELS, type AppointmentType, type Period } from "@/lib/labels";
import { sellerAddress } from "@/lib/furniture";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

export const metadata = { title: "Dashboard" };

function Delta({ current, previous, money = true }: { current: number | null; previous: number | null; money?: boolean }) {
  const d = delta(current, previous);
  if (d.value === null) return <p className="text-xs text-ink-muted">— vs mois précédent</p>;
  const sign = d.value > 0 ? "▲" : d.value < 0 ? "▼" : "=";
  const value = money ? formatEuro(Math.abs(d.value)) : formatNumber(Math.abs(d.value));
  return (
    <p className="text-xs text-ink-soft">
      <span aria-hidden>{sign} </span>
      <span className="sr-only">{d.value > 0 ? "hausse de" : d.value < 0 ? "baisse de" : "stable"} </span>
      {value}
      {d.percent !== null && ` (${d.percent > 0 ? "+" : ""}${formatPercent(d.percent)})`} vs mois précédent
    </p>
  );
}

function Tile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="panel space-y-1 p-4">
      <p className="section-title">{label}</p>
      <p className="text-2xl tabular-nums">{value}</p>
      {children}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const { mois } = await searchParams;
  const today = parisDay();
  const currentMonth = today.slice(0, 7);
  const month = mois && /^\d{4}-(0[1-9]|1[0-2])$/.test(mois) ? mois : currentMonth;
  const previousMonth = shiftMonth(month, -1);

  const supabase = await createClient();
  const horizon = parisDay(addDays(new Date(), 13));
  const [settings, { data }, { data: appts }] = await Promise.all([
    getSettings(supabase),
    supabase
      .from("furniture_overview")
      .select("id, name, status, mode, sold_at, received_at, final_sale_price, final_buyout_price, consignment_commission, adjustments_total, hours_total, first_accepted_at, first_refused_at"),
    supabase
      .from("appointments")
      .select("id, type, appointment_date, period, note, furniture_id, furnitures(name, seller_street, seller_postal_code, seller_city)")
      .eq("done", false)
      .gte("appointment_date", today)
      .lte("appointment_date", horizon)
      .in("type", ["seller_pickup", "buyer_pickup", "client_return"])
      .order("appointment_date")
      .order("period"),
  ]);
  const rows = (data ?? []) as DashboardRow[];
  const rate = settings.hourly_rate;

  const cur = monthStats(rows, month, rate);
  const prev = monthStats(rows, previousMonth, rate);
  const series = last12Months(rows, month, rate);
  const acceptance = acceptanceRate(rows, month, (iso) => parisDay(iso));
  const stock = immobilizedStock(rows);
  const newCount = rows.filter((r) => r.status === "new").length;
  const byStatus = Object.fromEntries([...KANBAN_COLUMNS, ...ARCHIVE_STATUSES].map((s) => [s, rows.filter((r) => r.status === s).length]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl">Dashboard</h1>
        <form method="get" className="flex items-center gap-2" aria-label="Choix du mois">
          <Link href={`/?mois=${previousMonth}`} className="btn-ghost btn-sm" aria-label="Mois précédent">←</Link>
          <label htmlFor="mois" className="sr-only">Mois</label>
          <input id="mois" name="mois" type="month" defaultValue={month} className="field w-auto" />
          <button type="submit" className="btn-secondary btn-sm">Afficher</button>
          <Link href={`/?mois=${shiftMonth(month, 1)}`} className="btn-ghost btn-sm" aria-label="Mois suivant">→</Link>
          {month !== currentMonth && <Link href="/" className="btn-ghost btn-sm">Mois en cours</Link>}
        </form>
      </div>

      {newCount > 0 && (
        <Link href="/crm?statut=new" className="block rounded-ui border border-accent bg-accent/10 px-4 py-2 text-sm hover:bg-accent/20">
          {newCount} nouvelle{newCount > 1 ? "s" : ""} demande{newCount > 1 ? "s" : ""} à traiter →
        </Link>
      )}

      <section aria-labelledby="kpi-title" className="space-y-3">
        <h2 id="kpi-title" className="text-lg capitalize">{monthLabel(month)}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Meubles vendus" value={String(cur.soldCount)}>
            <Delta current={cur.soldCount} previous={prev.soldCount} money={false} />
          </Tile>
          <Tile label="Chiffre d'affaires TTC" value={formatEuro(cur.revenue)}>
            <Delta current={cur.revenue} previous={prev.revenue} />
          </Tile>
          <Tile label="Marge totale" value={formatEuro(cur.margin)}>
            <Delta current={cur.margin} previous={prev.margin} />
            {cur.incompleteMargins > 0 && <p className="text-xs text-amber-800">{cur.incompleteMargins} vente{cur.incompleteMargins > 1 ? "s" : ""} sans marge calculable</p>}
          </Tile>
          <Tile label="Marge moyenne / meuble" value={formatEuro(cur.averageMargin)}>
            <Delta current={cur.averageMargin} previous={prev.averageMargin} />
          </Tile>
        </div>
        <p className="text-xs text-ink-muted">
          Chiffres basés sur la date de vente. Marge : rachat = {rate > 0 ? "marge nette" : "marge brute"} ; dépôt-vente = recette (commission + temps refacturable + ajustements).
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="chart-title" className="panel p-5">
          <h2 id="chart-title" className="section-title mb-3">CA et marge — 12 derniers mois</h2>
          <RevenueChart data={series} />
        </section>

        <section aria-labelledby="indicators-title" className="panel space-y-4 p-5">
          <h2 id="indicators-title" className="section-title">Indicateurs du mois</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-muted">Rachat direct</dt>
            <dd className="text-right tabular-nums">{cur.buyout.count} · {formatEuro(cur.buyout.revenue)}</dd>
            <dt className="text-ink-muted">Dépôt-vente</dt>
            <dd className="text-right tabular-nums">{cur.consignment.count} · {formatEuro(cur.consignment.revenue)}</dd>
            <dt className="text-ink-muted">Délai moyen réception → vente</dt>
            <dd className="text-right tabular-nums">{cur.averageDaysToSell === null ? "—" : `${formatNumber(cur.averageDaysToSell)} j`}</dd>
            <dt className="text-ink-muted">Taux d&apos;acceptation</dt>
            <dd className="text-right tabular-nums">
              {formatPercent(acceptance.rate)}
              <span className="block text-xs text-ink-muted">{acceptance.accepted} acceptée{acceptance.accepted > 1 ? "s" : ""} / {acceptance.accepted + acceptance.refused} tranchée{acceptance.accepted + acceptance.refused > 1 ? "s" : ""}</span>
            </dd>
          </dl>
          <div className="border-t border-line-soft pt-3">
            <h3 className="mb-2 text-sm text-ink-muted">Stock immobilisé (aujourd&apos;hui)</h3>
            <p className="text-sm"><span className="text-xl tabular-nums">{formatEuro(stock.buyoutValue)}</span> en rachats non vendus ({stock.buyoutCount})</p>
            <p className="text-sm">{stock.consignmentCount} dépôt{stock.consignmentCount > 1 ? "s" : ""}-vente en stock</p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="status-title" className="panel p-5">
          <h2 id="status-title" className="section-title mb-3">Meubles par statut</h2>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {[...KANBAN_COLUMNS, ...ARCHIVE_STATUSES].map((s) => (
              <li key={s}>
                <Link href={`/crm?statut=${s}`} className="flex justify-between rounded-ui px-2 py-1 hover:bg-paper-alt">
                  <span>{STATUS_SHORT_LABELS[s as FurnitureStatus]}</span>
                  <span className="tabular-nums">{byStatus[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="agenda-title" className="panel p-5">
          <h2 id="agenda-title" className="section-title mb-3">Agenda des 14 prochains jours</h2>
          <ul className="divide-y divide-line-soft text-sm">
            {(appts ?? []).map((a) => {
              const furniture = a.furnitures as unknown as { name: string; seller_street: string; seller_postal_code: string; seller_city: string } | null;
              return (
                <li key={a.id} className="py-2">
                  <p>
                    <span className="capitalize">{formatLongDate(a.appointment_date)}</span>, {PERIOD_LABELS[a.period as Period].toLowerCase()} — {APPOINTMENT_TYPE_LABELS[a.type as AppointmentType]}
                  </p>
                  <p className="text-xs text-ink-soft">
                    <Link href={`/meubles/${a.furniture_id}`} className="underline">{furniture?.name}</Link>
                    {furniture && a.type === "seller_pickup" && ` · ${sellerAddress(furniture)}`}
                    {a.note && ` · ${a.note}`}
                  </p>
                </li>
              );
            })}
            {!appts?.length && <li className="py-2 text-ink-muted">Aucun rendez-vous prévu.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
