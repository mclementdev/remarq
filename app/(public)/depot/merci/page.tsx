import type { Metadata } from "next";
import Link from "next/link";
import { getShopUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Merci" };

export default async function MerciPage({ searchParams }: { searchParams: Promise<{ pieces?: string }> }) {
  const count = Math.min(Math.max(Number((await searchParams).pieces) || 1, 1), 10);
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-12 text-center">
      <p aria-hidden className="text-4xl">✓</p>
      <h1 className="text-2xl sm:text-3xl">Merci !</h1>
      <p className="mx-auto max-w-md text-ink-soft">
        {count > 1
          ? `Nous avons bien reçu votre demande pour ${count} pièces. Nous vous envoyons notre estimation sous 48 h.`
          : "Nous avons bien reçu votre demande. Nous vous envoyons notre estimation sous 48 h."}
      </p>
      <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
        <Link href="/depot" className="btn-primary">Proposer d&apos;autres pièces</Link>
        <a href={getShopUrl()} className="btn-secondary">Retour au site</a>
      </div>
      <p className="text-xs text-ink-muted">Vos coordonnées et votre adresse seront pré-remplies.</p>
    </div>
  );
}
