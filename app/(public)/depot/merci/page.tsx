import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Merci" };

export default function MerciPage() {
  return (
    <div className="space-y-6 py-12 text-center">
      <p aria-hidden className="text-4xl">✓</p>
      <h1 className="text-2xl sm:text-3xl">Merci !</h1>
      <p className="mx-auto max-w-md text-ink-soft">
        Merci, nous avons bien reçu votre demande, nous revenons vers vous rapidement.
      </p>
      <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
        <Link href="/depot" className="btn-primary">Déposer un autre meuble</Link>
        <a href="https://mobilistore.fr" className="btn-secondary">Retour au site</a>
      </div>
      <p className="text-xs text-ink-muted">Vos coordonnées seront pré-remplies pour le meuble suivant.</p>
    </div>
  );
}
