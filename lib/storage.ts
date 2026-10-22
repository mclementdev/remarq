import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const PHOTO_BUCKET = "furniture-photos";
export const ATTACHMENT_BUCKET = "attachments";
const TTL_SECONDS = 60 * 60;

/** Signe un lot de chemins (URL temporaires d'1 h). Renvoie chemin → URL. */
export async function signPaths(
  supabase: SupabaseClient<Database>,
  paths: (string | null | undefined)[],
  bucket = PHOTO_BUCKET,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  if (!unique.length) return {};
  const { data } = await supabase.storage.from(bucket).createSignedUrls(unique, TTL_SECONDS);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
