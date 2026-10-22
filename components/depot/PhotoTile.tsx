"use client";

import { useId, useRef } from "react";
import clsx from "clsx";

export type PhotoItem = {
  key: string;
  slot: "front" | "back" | "side" | "detail" | "defect" | "other";
  file: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  progress: number;
  path?: string;
  thumbPath?: string;
  error?: string;
};

type Props = {
  label: string;
  hint?: string;
  item?: PhotoItem;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRetry: () => void;
  onRemove: () => void;
};

export function PhotoTile({ label, hint, item, disabled, onSelect, onRetry, onRemove }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={clsx(
          "relative aspect-square overflow-hidden rounded-ui border bg-paper-alt",
          item?.status === "error" ? "border-danger" : "border-line",
          !item && !disabled && "border-dashed hover:border-ink",
        )}
      >
        {item ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) */}
            <img src={item.previewUrl} alt={`Photo ${label}`} className="h-full w-full object-cover" />
            {item.status === "uploading" && (
              <div className="absolute inset-x-0 bottom-0 bg-paper/90 p-2">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft"
                  role="progressbar"
                  aria-label={`Envoi de la photo ${label}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(item.progress * 100)}
                >
                  <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                </div>
                <p className="mt-1 text-center text-[11px] text-ink-soft">Envoi… {Math.round(item.progress * 100)} %</p>
              </div>
            )}
            {item.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/90 p-2 text-center">
                <p className="text-xs text-danger">Échec de l&apos;envoi</p>
                <button type="button" className="btn-primary btn-sm" onClick={onRetry}>Réessayer</button>
              </div>
            )}
            {item.status === "done" && (
              <span className="absolute left-1.5 top-1.5 rounded-badge bg-paper/90 px-1.5 py-0.5 text-[11px] text-success" aria-label="Photo envoyée">
                ✓ Envoyée
              </span>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-lg leading-none hover:bg-paper"
              aria-label={`Retirer la photo ${label}`}
            >
              ×
            </button>
          </>
        ) : (
          <label
            htmlFor={inputId}
            className={clsx(
              "flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center",
              disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
            )}
          >
            <span aria-hidden className="text-3xl font-light leading-none">+</span>
            <span className="text-xs uppercase tracking-button">
              Ajouter<span className="sr-only"> la photo {label}</span>
            </span>
          </label>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || !!item}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-center text-xs text-ink-soft">
        {label}
        {hint && <span className="block text-[11px] text-ink-muted">{hint}</span>}
      </p>
    </div>
  );
}
