/* eslint-disable @next/next/no-img-element -- fichiers SVG statiques */
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { SALON_SOURCES } from "@/lib/content/salon";
import { absoluteUrl } from "@/lib/site-url";

export const metadata = { title: "QR codes" };

const LABELS: Record<string, string> = {
  stand: "Stand (affiche, comptoir)",
  carte: "Cartes de visite",
  flyer: "Flyers",
  ig: "Instagram",
  carjager: "Réseaux CarJager",
};

export default function QrPage() {
  let base = "https://remarq.fr";
  try {
    base = fs.readFileSync(path.join(process.cwd(), "public/qr/base.txt"), "utf8").trim();
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-ink-muted"><Link href="/reglages" className="hover:underline">Réglages</Link> / QR codes</p>
        <h1 className="text-2xl">QR codes du salon</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Chaque QR mène à <strong>{base}/d/…</strong>, qui redirige vers la landing avec sa source. Avant l&apos;impression, vérifiez que les
          redirections Shopify existent et scannez chaque code avec un téléphone. Format vectoriel (SVG) : imprimez au moins 2 × 2 cm, sans réduire la marge blanche.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {SALON_SOURCES.map((s) => (
          <li key={s} className="panel space-y-3 p-4">
            <p className="font-bold">{LABELS[s]}</p>
            <img src={`/qr/${s}.svg`} alt={`QR code ${LABELS[s]} vers ${base}/d/${s}`} className="w-full border border-line-soft bg-white" />
            <p className="break-all text-xs text-ink-muted">{base}/d/{s}</p>
            <p className="break-all text-xs text-ink-muted">
              Lien direct de l&apos;outil : <a href={absoluteUrl(`/d/${s}`)} className="underline">{absoluteUrl(`/d/${s}`)}</a>
            </p>
            <a href={`/qr/${s}.svg`} download={`remarq-qr-${s}.svg`} className="btn-secondary btn-sm w-full">Télécharger (SVG)</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
