"use client";

import { useEffect, useRef, useState } from "react";
import { HighlightTextarea } from "./HighlightTextarea";
import { copyText } from "@/components/ui/CopyButton";
import { findPlaceholders, renderEmail, type EmailVars } from "@/lib/emails/render";
import type { EmailTemplateKey } from "@/lib/emails/templates";
import { logEmail } from "@/lib/actions/status";

type Props = {
  furnitureId: string;
  templateKey: EmailTemplateKey;
  vars: EmailVars;
  to: string;
};

/** Objet + corps modifiables, boutons de copie et lien mailto: (aucun envoi par l'outil). */
export function EmailComposer({ furnitureId, templateKey, vars, to }: Props) {
  const initial = renderEmail(templateKey, vars);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [copied, setCopied] = useState<string | null>(null);
  const loggedCopy = useRef(false);
  const loggedOpen = useRef(false);

  useEffect(() => {
    if (loggedOpen.current) return;
    loggedOpen.current = true;
    logEmail(furnitureId, templateKey, "prepared");
  }, [furnitureId, templateKey]);

  const remaining = [...findPlaceholders(subject), ...findPlaceholders(body)];

  const doCopy = async (what: "subject" | "body" | "all") => {
    const text = what === "subject" ? subject : what === "body" ? body : `Objet : ${subject}\n\n${body}`;
    if (await copyText(text)) {
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
      if (!loggedCopy.current) {
        loggedCopy.current = true;
        logEmail(furnitureId, templateKey, "copied");
      }
    }
  };

  // Les clients mail limitent la longueur des liens mailto: ; au-delà, on ne pré-remplit que l'objet.
  const mailto = (() => {
    const full = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return full.length < 1900 ? full : `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}`;
  })();

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Destinataire : <span className="text-ink">{to}</span>
      </p>
      <div>
        <label htmlFor="email-subject" className="field-label">Objet</label>
        <HighlightTextarea id="email-subject" label="Objet" value={subject} onChange={setSubject} singleLine />
      </div>
      <div>
        <label htmlFor="email-body" className="field-label">Corps du message</label>
        <HighlightTextarea id="email-body" label="Corps du message" value={body} onChange={setBody} rows={18} />
      </div>
      <p className={remaining.length ? "text-sm text-amber-800" : "text-sm text-success"} aria-live="polite">
        {remaining.length
          ? `${remaining.length} zone${remaining.length > 1 ? "s" : ""} à compléter (surlignée${remaining.length > 1 ? "s" : ""}).`
          : "Toutes les zones sont complétées."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={() => doCopy("subject")}>{copied === "subject" ? "Copié ✓" : "Copier l'objet"}</button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => doCopy("body")}>{copied === "body" ? "Copié ✓" : "Copier le corps"}</button>
        <button type="button" className="btn-primary btn-sm" onClick={() => doCopy("all")}>{copied === "all" ? "Copié ✓" : "Copier tout"}</button>
        <a href={mailto} className="btn-ghost btn-sm">Ouvrir dans ma messagerie</a>
      </div>
    </div>
  );
}
