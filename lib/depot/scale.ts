import { z } from "zod";

/** Barème de partage dépôt-vente : tranche (borne haute exclue, null = « et plus ») → % reversé au vendeur. */
export type ScaleRow = { up_to: number | null; percent: number };

export const DEFAULT_SCALE: ScaleRow[] = [
  { up_to: 500, percent: 40 },
  { up_to: 1000, percent: 50 },
  { up_to: 2500, percent: 60 },
  { up_to: null, percent: 70 },
];

const rowSchema = z.object({
  up_to: z.number().int().positive().max(1_000_000).nullable(),
  percent: z.number().min(0).max(100),
});

/** Valide un barème : bornes croissantes, seule la dernière ligne est ouverte (« et plus »). */
export const scaleSchema = z
  .array(rowSchema)
  .min(1, "Le barème doit contenir au moins une ligne.")
  .max(10)
  .refine((rows) => rows.every((r, i) => (i === rows.length - 1 ? r.up_to === null : r.up_to !== null)), {
    message: "Seule la dernière tranche est « et plus ».",
  })
  .refine((rows) => rows.every((r, i) => i === 0 || r.up_to === null || r.up_to > (rows[i - 1].up_to ?? 0)), {
    message: "Les montants doivent être croissants.",
  });

export function parseScale(value: unknown): ScaleRow[] {
  const parsed = scaleSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_SCALE;
}

const euro = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} €`;

/** Libellés des tranches : « Moins de 500 € », « 500 à 999 € », « 2 500 € et plus ». */
export function scaleLabels(rows: ScaleRow[]): { label: string; percent: number }[] {
  return rows.map((r, i) => {
    const from = i === 0 ? null : rows[i - 1].up_to;
    const label =
      r.up_to === null
        ? from === null ? "Tous les prix" : `${euro(from)} et plus`
        : from === null ? `Moins de ${euro(r.up_to)}` : `${new Intl.NumberFormat("fr-FR").format(from)} à ${euro(r.up_to - 1)}`;
    return { label, percent: r.percent };
  });
}
