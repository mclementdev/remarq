import { Footer } from "@/components/site/Footer";

/** Habillage des pages publiques : style de la page « Vendre » (classe `site`) et pied de page. Pas d'en-tête. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site flex min-h-dvh flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
