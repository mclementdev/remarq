"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

/** Fenêtre modale basée sur <dialog> (focus, Échap et fond gérés par le navigateur). */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-title"
      className={clsx(
        "m-auto max-h-[90dvh] w-[calc(100%-2rem)] rounded-ui border border-line-soft bg-paper p-0 text-ink backdrop:bg-ink/40",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-2xl",
        size === "xl" && "max-w-4xl",
      )}
    >
      {open && (
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-3">
            <h2 id="dialog-title" className="text-lg">{title}</h2>
            <button type="button" onClick={onClose} className="btn-ghost btn-sm" aria-label="Fermer">✕</button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
