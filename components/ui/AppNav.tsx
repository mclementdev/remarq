"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { logout } from "@/app/(public)/connexion/actions";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/crm", label: "CRM" },
  { href: "/meubles", label: "Tous les meubles" },
  { href: "/reglages", label: "Réglages" },
];

export function AppNav({ firstName }: { firstName: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-page items-center gap-6 px-4 lg:px-8">
        <Link href="/" aria-label="Accueil"><Logo size={28} /></Link>
        <nav aria-label="Navigation principale" className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "whitespace-nowrap rounded-ui px-3 py-1.5 text-xs uppercase tracking-button",
                  active ? "bg-ink text-paper" : "text-ink hover:bg-paper-alt",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden text-sm text-ink-muted md:inline">{firstName}</span>
        <form action={logout}>
          <button type="submit" className="btn-ghost btn-sm">Déconnexion</button>
        </form>
      </div>
    </header>
  );
}
