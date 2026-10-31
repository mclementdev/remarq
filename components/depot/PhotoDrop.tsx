"use client";

import { useId, useState } from "react";
import clsx from "clsx";

/** Zone « Ajouter des photos » : sélection multiple (appareil photo ou galerie) ou glisser-déposer. */
export function PhotoDrop({ label, disabled, invalid, describedBy, onFiles }: {
  label: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onFiles: (files: File[]) => void;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || /\.hei[cf]$/i.test(f.name));
        if (files.length) onFiles(files);
      }}
    >
      <label
        htmlFor={id}
        className={clsx(
          "flex flex-col items-center justify-center gap-1 rounded-ui border border-dashed px-4 py-7 text-center",
          invalid ? "border-danger" : over ? "border-ink bg-paper-alt" : "border-line",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-ink",
        )}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <span className="font-bold">{label}</span>
        <span className="text-sm text-ink-soft">Glissez-déposez ou cliquez · depuis votre téléphone : appareil photo ou galerie</span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
