import { depotContent } from "@/lib/content/depot";

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

/** Accroche de la colonne de gauche, à côté du formulaire. */
export function DepotIntroHeader() {
  return (
    <div className="space-y-4">
      <h2 className="text-4xl sm:text-5xl">{c.title}</h2>
      <p className="text-sm text-ink-soft sm:text-base">{c.text}</p>
    </div>
  );
}

/** Les 3 avantages. */
export function DepotIntro() {
  return (
    <ul className="space-y-5">
      {c.benefits.map((b) => (
        <li key={b.title} className="flex gap-4">
          <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-ink" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {ICONS[b.icon]}
          </svg>
          <div>
            <p className="font-semibold">{b.title}</p>
            {b.text && <p className="text-sm text-ink-soft">{b.text}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
