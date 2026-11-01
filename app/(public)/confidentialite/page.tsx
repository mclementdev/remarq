import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = { title: "Politique de confidentialité", robots: { index: true, follow: true } };

/** PROVISOIRE : texte à faire valider (entité juridique, contact, durées) avant la mise en ligne définitive. */
export default function ConfidentialitePage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl">Politique de confidentialité</h1>
        <p className="rounded-ui border border-accent bg-paper p-3 text-sm">Version provisoire — à compléter avec les mentions légales de Remarq.</p>
        <section className="space-y-2">
          <h2 className="text-2xl">Qui traite vos données ?</h2>
          <p>Remarq — [à compléter : dénomination, forme juridique, adresse, SIREN]. Contact : contact@remarq.fr.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-2xl">Votre e-mail laissé sur la page du salon</h2>
          <p>Il sert uniquement à vous envoyer le lien du formulaire et, si vous l&apos;avez demandé, une invitation de rappel. Il n&apos;est ni revendu ni utilisé pour de la prospection. Conservation : [à compléter, par exemple 6 mois].</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-2xl">Les informations du formulaire de dépôt</h2>
          <p>Vos coordonnées, la description et les photos de votre meuble servent à étudier votre demande, à vous faire une proposition et, le cas échéant, à organiser l&apos;enlèvement et la vente. Conservation : [à compléter].</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-2xl">Hébergement</h2>
          <p>Données hébergées dans l&apos;Union européenne (Supabase, région Paris). Application servie par Vercel. E-mails envoyés par Resend.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-2xl">Vos droits</h2>
          <p>Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en écrivant à contact@remarq.fr. Vous pouvez aussi saisir la CNIL (cnil.fr).</p>
        </section>
        <p><Link href="/depot" className="underline">← Retour</Link></p>
      </div>
    </SiteShell>
  );
}
