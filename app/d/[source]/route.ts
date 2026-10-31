import { NextResponse } from "next/server";
import { parseSource, SALON_SOURCES } from "@/lib/content/salon";

/**
 * Liens courts des supports imprimés et des réseaux : /d/carte → /salon?source=carte.
 * Chemins stables (les redirections Shopify remarq.fr/d/… y renvoient). Redirection
 * temporaire (307) pour pouvoir changer la cible sans cache navigateur.
 */
export function GET(request: Request, { params }: { params: Promise<{ source: string }> }) {
  return params.then(({ source }) => {
    const known = (SALON_SOURCES as readonly string[]).includes(source);
    const target = new URL(known ? `/salon?source=${parseSource(source)}` : "/salon", request.url);
    return NextResponse.redirect(target, 307);
  });
}
