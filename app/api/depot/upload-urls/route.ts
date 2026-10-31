import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "furniture-photos";
/** Garde-fou : objets max dans un dossier de dépôt (10 pièces × 10 photos × 2 fichiers, plus les réessais). */
const MAX_OBJECTS_PER_SUBMISSION = 260;

const bodySchema = z.object({ submissionId: z.uuid() });

/**
 * Génère deux URL d'upload signées (image + vignette) pour une photo du
 * formulaire public. Le bucket est privé ; l'anonyme n'y a aucun droit direct.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { submissionId } = parsed.data;

  const supabase = createAdminClient();
  const folder = `depot/${submissionId}`;

  const { data: existing, error: listError } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
  if (listError) return NextResponse.json({ error: "Stockage indisponible." }, { status: 500 });
  if ((existing?.length ?? 0) >= MAX_OBJECTS_PER_SUBMISSION) {
    return NextResponse.json({ error: "Trop de fichiers envoyés pour cette demande." }, { status: 429 });
  }

  // Une demande déjà finalisée ne peut plus recevoir de fichiers.
  const { count } = await supabase
    .from("furnitures")
    .select("id", { count: "exact", head: true })
    .eq("submission_id", submissionId);
  if (count) return NextResponse.json({ error: "Demande déjà envoyée." }, { status: 409 });

  const fileId = crypto.randomUUID();
  const path = `${folder}/${fileId}.jpg`;
  const thumbPath = `${folder}/${fileId}_thumb.jpg`;

  const [main, thumb] = await Promise.all([
    supabase.storage.from(BUCKET).createSignedUploadUrl(path),
    supabase.storage.from(BUCKET).createSignedUploadUrl(thumbPath),
  ]);
  if (main.error || thumb.error) {
    return NextResponse.json({ error: "Impossible de préparer l'envoi." }, { status: 500 });
  }

  return NextResponse.json({
    path,
    thumbPath,
    uploadUrl: main.data.signedUrl,
    thumbUploadUrl: thumb.data.signedUrl,
  });
}
