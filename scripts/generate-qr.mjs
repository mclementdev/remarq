#!/usr/bin/env node
/**
 * Génère les QR codes des supports du salon dans public/qr/<source>.svg.
 *
 *   npm run qr                                  encode https://remarq.fr/d/<source>
 *   QR_BASE_URL=https://sell.remarq.fr npm run qr   autre base
 *
 * Noir sur blanc, marge de 4 modules (zone de silence recommandée), correction « M ».
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = ["stand", "carte", "flyer", "ig", "carjager"];
const base = (process.env.QR_BASE_URL || "https://remarq.fr").replace(/\/+$/, "");
const outDir = path.join(root, "public/qr");
fs.mkdirSync(outDir, { recursive: true });

for (const source of SOURCES) {
  const url = `${base}/d/${source}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
  fs.writeFileSync(path.join(outDir, `${source}.svg`), svg);
  console.log(`public/qr/${source}.svg → ${url}`);
}
fs.writeFileSync(path.join(outDir, "base.txt"), `${base}\n`);
