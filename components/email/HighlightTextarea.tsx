"use client";

import { useRef } from "react";
import clsx from "clsx";
import { PLACEHOLDER } from "@/lib/emails/render";

function highlight(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(new RegExp(PLACEHOLDER.source, "g"))) {
    parts.push(text.slice(last, m.index));
    parts.push(<mark key={m.index} className="rounded-sm bg-amber-200/80 text-transparent">{m[0]}</mark>);
    last = (m.index ?? 0) + m[0].length;
  }
  parts.push(text.slice(last));
  // Retour à la ligne final : garde la même hauteur que la zone de saisie.
  parts.push("\n");
  return parts;
}

/** Zone de texte modifiable qui surligne les « [à compléter : …] » restants. */
export function HighlightTextarea({
  id,
  value,
  onChange,
  rows = 16,
  singleLine = false,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  singleLine?: boolean;
  label: string;
}) {
  const backdrop = useRef<HTMLDivElement>(null);
  const common = "w-full whitespace-pre-wrap break-words px-3 py-2 font-sans text-[14px] leading-6";
  return (
    <div className="relative rounded-ui border border-line focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
      <div ref={backdrop} aria-hidden className={clsx(common, "pointer-events-none absolute inset-0 overflow-hidden text-transparent")}>
        {highlight(value)}
      </div>
      {singleLine ? (
        <input
          id={id}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(common, "relative block bg-transparent outline-none")}
        />
      ) : (
        <textarea
          id={id}
          aria-label={label}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (backdrop.current) backdrop.current.scrollTop = e.currentTarget.scrollTop;
          }}
          className={clsx(common, "relative block resize-y bg-transparent outline-none")}
        />
      )}
    </div>
  );
}
