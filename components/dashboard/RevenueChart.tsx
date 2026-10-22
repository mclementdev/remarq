"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuro } from "@/lib/format";

// Palette validée (scripts/validate_palette.js, mode clair) : CVD ΔE ≥ 21, contraste ≥ 3:1.
const COLORS = { revenue: "#3b6ea8", margin: "#d9660d" };

type Point = { month: string; label: string; revenue: number; margin: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-ui border border-line-soft bg-paper px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium capitalize">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ background: COLORS[p.dataKey as keyof typeof COLORS] }} />
          <span className="text-ink-soft">{p.dataKey === "revenue" ? "CA TTC" : "Marge"}</span>
          <span className="ml-auto tabular-nums text-ink">{formatEuro(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <figure className="space-y-2">
      <div className="h-72 w-full" role="img" aria-label="Chiffre d'affaires et marge par mois sur 12 mois">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#ececec" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#d4d4d4" }} tick={{ fontSize: 11, fill: "#6b6b6b" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fontSize: 11, fill: "#6b6b6b" }}
              tickFormatter={(v: number) => formatEuro(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(18,18,18,0.04)" }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              iconSize={10}
              formatter={(v: string) => <span className="text-xs text-ink-soft">{v === "revenue" ? "CA TTC" : "Marge"}</span>}
            />
            <Bar dataKey="revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="margin" fill={COLORS.margin} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-ink-muted">Voir les données en tableau</summary>
        <table className="mt-2 w-full">
          <thead className="text-left text-ink-muted"><tr><th className="py-1 font-normal">Mois</th><th className="py-1 text-right font-normal">CA TTC</th><th className="py-1 text-right font-normal">Marge</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-line-soft">
                <td className="py-1 capitalize">{d.label}</td>
                <td className="py-1 text-right tabular-nums">{formatEuro(d.revenue)}</td>
                <td className="py-1 text-right tabular-nums">{formatEuro(d.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
