"use client";

/* eslint-disable @next/next/no-img-element -- URL signées temporaires Supabase */
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { uploadFurnitureImage } from "@/lib/image";
import { PHOTO_SLOT_LABELS, type PhotoKind, type PhotoSlot } from "@/lib/labels";
import { deletePhoto, registerPhotos, reorderPhotos, setMainPhoto } from "@/app/(app)/meubles/[id]/actions";
import { Dialog } from "@/components/ui/Dialog";

export type GalleryPhoto = {
  id: string;
  url: string | null;
  thumbUrl: string | null;
  isMain: boolean;
  slot: PhotoSlot;
};

type Props = {
  furnitureId: string;
  kind: PhotoKind;
  photos: GalleryPhoto[];
  /** Gestion de la photo principale (photos du meuble uniquement). */
  withMain?: boolean;
  emptyText?: string;
};

function SortableThumb({
  photo,
  index,
  withMain,
  onOpen,
}: {
  photo: GalleryPhoto;
  index: number;
  withMain: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx("relative aspect-square overflow-hidden rounded-ui border border-line-soft bg-paper-alt", isDragging && "z-10 opacity-80 ring-2 ring-ink")}
    >
      <button type="button" onClick={onOpen} className="block h-full w-full" aria-label={`Agrandir la photo ${index + 1}`}>
        {photo.thumbUrl && <img src={photo.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
      </button>
      {withMain && photo.isMain && <span className="absolute left-1 top-1 rounded-badge bg-accent px-1.5 text-[10px] uppercase">Principale</span>}
      {photo.slot !== "other" && <span className="absolute bottom-1 left-1 rounded-badge bg-paper/90 px-1.5 text-[10px]">{PHOTO_SLOT_LABELS[photo.slot]}</span>}
      <span
        {...attributes}
        {...listeners}
        className="absolute right-1 top-1 cursor-grab rounded-badge bg-paper/90 px-1.5 text-xs active:cursor-grabbing"
        aria-label={`Déplacer la photo ${index + 1}`}
        title="Glisser pour réordonner"
      >
        ⠿
      </span>
    </li>
  );
}

export function PhotoGallery({ furnitureId, kind, photos: initial, withMain = false, emptyText = "Aucune photo." }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => setPhotos(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = photos.findIndex((p) => p.id === e.active.id);
    const to = photos.findIndex((p) => p.id === e.over!.id);
    const next = arrayMove(photos, from, to);
    setPhotos(next);
    startTransition(async () => {
      const res = await reorderPhotos(furnitureId, next.map((p) => p.id));
      if (!res.ok) setError(res.error);
    });
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    setUploading({ done: 0, total: list.length });
    const uploaded: { path: string; thumbPath: string }[] = [];
    for (const file of list) {
      try {
        uploaded.push(await uploadFurnitureImage(supabase, furnitureId, file));
      } catch {
        setError(`Échec de l'envoi de « ${file.name} ».`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    if (uploaded.length) {
      const res = await registerPhotos(furnitureId, kind, uploaded);
      if (!res.ok) setError(res.error);
    }
    setUploading(null);
    router.refresh();
  };

  const current = openIndex !== null ? photos[openIndex] : null;

  return (
    <div className="space-y-3">
      {photos.length ? (
        <DndContext id={`gallery-${kind}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              {photos.map((p, i) => (
                <SortableThumb key={p.id} photo={p} index={i} withMain={withMain} onOpen={() => setOpenIndex(i)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-sm text-ink-muted">{emptyText}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className={clsx("btn-secondary btn-sm cursor-pointer", uploading && "pointer-events-none opacity-50")}>
          Ajouter des photos
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        </label>
        {uploading && <span className="text-sm text-ink-soft" aria-live="polite">Envoi {uploading.done} / {uploading.total}…</span>}
        {pending && <span className="text-sm text-ink-muted">Enregistrement…</span>}
        {error && <span role="alert" className="text-sm text-danger">{error}</span>}
      </div>

      <Dialog
        open={current !== null}
        onClose={() => setOpenIndex(null)}
        title={current ? `Photo ${openIndex! + 1} / ${photos.length}` : ""}
        size="xl"
        footer={
          current && (
            <>
              <button type="button" className="btn-ghost btn-sm" disabled={openIndex === 0} onClick={() => setOpenIndex((i) => (i ? i - 1 : 0))}>← Précédente</button>
              <button type="button" className="btn-ghost btn-sm" disabled={openIndex === photos.length - 1} onClick={() => setOpenIndex((i) => Math.min(photos.length - 1, (i ?? 0) + 1))}>Suivante →</button>
              <span className="flex-1" />
              {withMain && !current.isMain && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => startTransition(async () => {
                    const res = await setMainPhoto(current.id);
                    if (res.ok) {
                      setPhotos((list) => list.map((p) => ({ ...p, isMain: p.id === current.id })));
                      router.refresh();
                    } else setError(res.error);
                  })}
                >
                  Définir comme principale
                </button>
              )}
              {current.url && <a href={current.url} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">Ouvrir l&apos;original</a>}
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => {
                  if (!confirm("Supprimer définitivement cette photo ?")) return;
                  const id = current.id;
                  setOpenIndex(null);
                  startTransition(async () => {
                    const res = await deletePhoto(id);
                    if (res.ok) {
                      setPhotos((list) => list.filter((p) => p.id !== id));
                      router.refresh();
                    } else setError(res.error);
                  });
                }}
              >
                Supprimer
              </button>
            </>
          )
        }
      >
        {current?.url && <img src={current.url} alt="" className="mx-auto max-h-[65dvh] w-auto object-contain" />}
      </Dialog>
    </div>
  );
}
