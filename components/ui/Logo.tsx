/**
 * Logo provisoire : le mot « REMARQ » en Alte Haas Grotesk gras.
 * À remplacer par les fichiers officiels (carré noir, variante RQ) dès qu'ils sont dans public/brand/.
 */
export function Logo({ size = 32 }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center font-bold uppercase tracking-[0.14em] text-ink" style={{ fontSize: Math.round(size * 0.6) }}>
      Remarq
    </span>
  );
}
