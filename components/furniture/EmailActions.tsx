"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { EmailComposer } from "@/components/email/EmailComposer";
import { EMAIL_TEMPLATES, EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/lib/emails/templates";
import type { EmailVars } from "@/lib/emails/render";

/** Liste des 10 modèles, ouvrables à tout moment depuis la fiche. */
export function EmailActions({
  furnitureId,
  vars,
  to,
  suggested = [],
}: {
  furnitureId: string;
  vars: EmailVars;
  to: string;
  suggested?: EmailTemplateKey[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<EmailTemplateKey | null>(null);
  const others = EMAIL_TEMPLATE_KEYS.filter((k) => !suggested.includes(k));
  return (
    <div className="space-y-3">
      {suggested.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggested.map((k) => (
            <button key={k} type="button" className="btn-primary btn-sm" onClick={() => setOpen(k)}>
              ✉ {EMAIL_TEMPLATES[k].name}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <label htmlFor="email-template" className="field-label">Préparer un autre e-mail</label>
          <select
            id="email-template"
            className="field"
            value=""
            onChange={(e) => e.target.value && setOpen(e.target.value as EmailTemplateKey)}
          >
            <option value="">Choisir un modèle…</option>
            {others.map((k) => (
              <option key={k} value={k}>{EMAIL_TEMPLATES[k].name}{EMAIL_TEMPLATES[k].optional ? " (optionnel)" : ""}</option>
            ))}
          </select>
        </div>
      </div>
      <Dialog
        open={open !== null}
        onClose={() => { setOpen(null); router.refresh(); }}
        title={open ? `Mail « ${EMAIL_TEMPLATES[open].name} »` : ""}
        size="xl"
        footer={<button type="button" className="btn-dark" onClick={() => { setOpen(null); router.refresh(); }}>Fermer</button>}
      >
        {open && <EmailComposer key={open} furnitureId={furnitureId} templateKey={open} vars={vars} to={to} />}
      </Dialog>
    </div>
  );
}
