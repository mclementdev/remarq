import { Logo } from "@/components/ui/Logo";
import { getShopUrl } from "@/lib/site-url";

export default function DepotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line-soft">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-center px-4">
          <a href={getShopUrl()} aria-label="Remarq — retour au site"><Logo size={36} /></a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:pt-12">{children}</main>
    </div>
  );
}
