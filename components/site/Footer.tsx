import Link from "next/link";
import { vendreContent } from "@/lib/content/vendre";
import { getShopUrl } from "@/lib/site-url";

const c = vendreContent.footer;

/** Pied de page noir : liens vers la boutique (remarq.fr) et vers les pages de l'outil (« app: »). */
export function Footer() {
  const shop = getShopUrl();
  return (
    <footer className="bg-[#111] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-12">
        <div className="grid gap-10 sm:grid-cols-3">
          {c.columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 text-2xl">{col.title}</h2>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("app:") ? (
                      <Link href={l.href.slice(4)} className="text-white/85 hover:text-white hover:underline">{l.label}</Link>
                    ) : (
                      <a href={`${shop}${l.href}`} className="text-white/85 hover:text-white hover:underline">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-12 border-t border-white/25 pt-5 text-xs text-white/75">{c.copyright}</p>
      </div>
    </footer>
  );
}
