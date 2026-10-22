"use client";

import { useState } from "react";
import clsx from "clsx";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Repli pour les contextes non sécurisés.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({
  text,
  label,
  className,
  onCopied,
}: {
  text: string;
  label: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={clsx("btn-secondary btn-sm", className)}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          onCopied?.();
          setTimeout(() => setCopied(false), 1500);
        }
      }}
    >
      <span aria-live="polite">{copied ? "Copié ✓" : label}</span>
    </button>
  );
}
