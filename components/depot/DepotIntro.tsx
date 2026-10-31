import { depotContent } from "@/lib/content/depot";
import { scaleLabels, type ScaleRow } from "@/lib/depot/scale";

const c = depotContent.intro;

const ICONS: Record<string, React.ReactNode> = {
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  euro: <path d="M17 6.5A6 6 0 1 0 17 17.5M5 10.5h8M5 13.5h8" />,
};

/** Accroche de la page /depot. */
export function DepotIntroHeader() {
  return (
    <div className="space-y-4">
      <p className="section-title">{c.eyebrow}</p>
      <h1 className="text-3xl leading-tight sm:text-4xl lg:text-5xl">{c.title}</h1>
      <p className="text-ink-soft">{c.text}</p>
    </div>
  );
}

/** Les 3 avantages et le barème de partage (réglage). */
export function DepotIntro({ scale }: { scale: ScaleRow[] }) {
  return (
    <div className="space-y-8">
      <ul className="space-y-5">
        {c.benefits.map((b) => (
          <li key={b.title} className="flex gap-4">
            <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {ICONS[b.icon]}
            </svg>
            <div>
              <p className="font-bold">{b.title}</p>
              <p className="text-ink-soft">{b.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="bareme-title" className="border-t border-line pt-6">
        <h2 id="bareme-title" className="mb-3 text-base font-bold">{c.scaleTitle}</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-ink-soft">
              <th scope="col" className="pb-2 font-normal">{c.scaleHeaders[0]}</th>
              <th scope="col" className="pb-2 text-right font-normal">{c.scaleHeaders[1]}</th>
            </tr>
          </thead>
          <tbody>
            {scaleLabels(scale).map((r) => (
              <tr key={r.label} className="border-t border-line-soft">
                <td className="py-3">{r.label}</td>
                <td className="py-3 text-right text-2xl">{r.percent} %</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-ink-soft">{c.scaleNote}</p>
      </section>
    </div>
  );
}
