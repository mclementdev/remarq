import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

// Alte Haas Grotesk (Yann Le Coroller), freeware : licence dans public/fonts/alte-haas-grotesk/LICENCE.rtf
const brand = localFont({
  variable: "--font-brand",
  display: "swap",
  src: [
    { path: "../public/fonts/alte-haas-grotesk/AlteHaasGrotesk-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/alte-haas-grotesk/AlteHaasGrotesk-Bold.ttf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Remarq — outil interne", template: "%s · Remarq" },
  description: "Réception, suivi et mise en ligne du mobilier Remarq.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={brand.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
