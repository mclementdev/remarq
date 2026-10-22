"use client";

import imageCompression from "browser-image-compression";

/** Photo principale : ≈ 2000 px max, JPEG qualité 0,85 (§5). */
export function compressMain(file: File) {
  return imageCompression(file, {
    maxWidthOrHeight: 2000,
    fileType: "image/jpeg",
    initialQuality: 0.85,
    maxSizeMB: 4,
    useWebWorker: true,
  });
}

/** Vignette pour le Kanban et les listes (la transformation d'images Supabase est payante). */
export function compressThumb(file: File) {
  return imageCompression(file, {
    maxWidthOrHeight: 400,
    fileType: "image/jpeg",
    initialQuality: 0.8,
    maxSizeMB: 0.2,
    useWebWorker: true,
  });
}

/** PUT vers une URL d'upload signée Supabase, avec suivi de progression. */
export function putToSignedUrl(url: string, blob: Blob, onProgress?: (ratio: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "image/jpeg");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Réseau indisponible"));
    xhr.send(blob);
  });
}

export type UploadedImage = { path: string; thumbPath: string };

/**
 * Compresse puis envoie une image et sa vignette pour un dépôt public.
 * `onProgress` reçoit un ratio 0–1 (10 % compression, 85 % image, 5 % vignette).
 */
export async function uploadDepotImage(
  file: File,
  submissionId: string,
  onProgress: (ratio: number) => void,
): Promise<UploadedImage> {
  onProgress(0.02);
  const [main, thumb] = await Promise.all([compressMain(file), compressThumb(file)]);
  onProgress(0.1);

  const res = await fetch("/api/depot/upload-urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Envoi impossible");

  await putToSignedUrl(body.uploadUrl, main, (r) => onProgress(0.1 + r * 0.85));
  await putToSignedUrl(body.thumbUploadUrl, thumb);
  onProgress(1);
  return { path: body.path, thumbPath: body.thumbPath };
}

/** Back-office (utilisateur connecté) : compresse et envoie une image dans meubles/{id}/. */
export async function uploadFurnitureImage(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  furnitureId: string,
  file: File,
): Promise<UploadedImage> {
  const [main, thumb] = await Promise.all([compressMain(file), compressThumb(file)]);
  const id = crypto.randomUUID();
  const path = `meubles/${furnitureId}/${id}.jpg`;
  const thumbPath = `meubles/${furnitureId}/${id}_thumb.jpg`;
  const bucket = supabase.storage.from("furniture-photos");
  const [a, b] = await Promise.all([
    bucket.upload(path, main, { contentType: "image/jpeg" }),
    bucket.upload(thumbPath, thumb, { contentType: "image/jpeg" }),
  ]);
  if (a.error || b.error) throw new Error("Envoi impossible");
  return { path, thumbPath };
}
