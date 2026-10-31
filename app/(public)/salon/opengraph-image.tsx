import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { salonContent } from "@/lib/content/salon";

export const alt = "Remarq — confiez-nous vos meubles de design";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image de partage aux couleurs de la charte (texte seul : pas de logo inventé). */
export default async function OpengraphImage() {
  const fonts = path.join(process.cwd(), "public/fonts/alte-haas-grotesk");
  const [regular, bold] = await Promise.all([
    readFile(path.join(fonts, "AlteHaasGrotesk-Regular.ttf")),
    readFile(path.join(fonts, "AlteHaasGrotesk-Bold.ttf")),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#faf2db", color: "#3a0305", padding: "72px 80px", fontFamily: "Alte Haas Grotesk" }}>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.14em" }}>REMARQ</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>{salonContent.hero.title}</div>
          <div style={{ fontSize: 30, maxWidth: 900, color: "#5a2e2c" }}>{salonContent.meta.shareTagline}</div>
        </div>
        <div style={{ height: 12, width: 160, background: "#c73e1d" }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Alte Haas Grotesk", data: regular, weight: 400, style: "normal" },
        { name: "Alte Haas Grotesk", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
