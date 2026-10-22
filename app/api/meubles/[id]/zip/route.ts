import JSZip from "jszip";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/storage";

function slug(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "meuble";
}

/** ZIP des photos de mise en ligne (à défaut, des photos du dépôt), dans l'ordre de la galerie. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Meuble introuvable.", { status: 404 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Session expirée.", { status: 401 });

  const [{ data: f }, { data: photos }] = await Promise.all([
    supabase.from("furniture_overview").select("name, brand_name").eq("id", id).maybeSingle(),
    supabase.from("photos").select("kind, storage_path, position, is_main").eq("furniture_id", id).in("kind", ["listing", "deposit"]).order("position"),
  ]);
  if (!f) return new Response("Meuble introuvable.", { status: 404 });

  const listing = (photos ?? []).filter((p) => p.kind === "listing");
  const selected = listing.length ? listing : (photos ?? []).filter((p) => p.kind === "deposit").sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.position - b.position);
  if (!selected.length) return new Response("Aucune photo à télécharger.", { status: 404 });

  const base = slug(`${f.name} ${f.brand_name ?? ""}`);
  const zip = new JSZip();
  const files = await Promise.all(selected.map((p) => supabase.storage.from(PHOTO_BUCKET).download(p.storage_path)));
  let added = 0;
  files.forEach((res, i) => {
    if (res.data) {
      zip.file(`${base}-${String(i + 1).padStart(2, "0")}.jpg`, res.data.arrayBuffer());
      added++;
    }
  });
  if (!added) return new Response("Téléchargement des photos impossible.", { status: 500 });

  const content = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
  return new Response(content as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${base}-photos.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
