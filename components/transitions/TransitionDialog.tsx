"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Dialog } from "@/components/ui/Dialog";
import { EmailComposer } from "@/components/email/EmailComposer";
import { createClient } from "@/lib/supabase/client";
import { uploadFurnitureImage } from "@/lib/image";
import { changeStatus } from "@/lib/actions/status";
import { registerPhotos } from "@/app/(app)/meubles/[id]/actions";
import { buildEmailVars } from "@/lib/emails/render";
import { EMAIL_TEMPLATES, type EmailTemplateKey } from "@/lib/emails/templates";
import { STATUS_LABELS, type FurnitureStatus } from "@/lib/status";
import { TRANSITIONS, transitionDefaults, visibleFields, type FieldSpec, type TransitionContext } from "@/lib/transitions";
import type { AppSettings } from "@/lib/settings";

/** Données de la fiche nécessaires aux variables des e-mails. */
export type EmailFurniture = Parameters<typeof buildEmailVars>[0] & { seller_email: string };

export type TransitionTarget = {
  furnitureId: string;
  furnitureName: string;
  to: FurnitureStatus;
  ctx: TransitionContext;
  email: { furniture: EmailFurniture; brandName: string | null };
};

type Props = {
  target: TransitionTarget | null;
  settings: AppSettings;
  onClose: () => void;
  /** Appelé dès que le statut a changé (avant l'éventuelle étape e-mail). */
  onChanged: (furnitureId: string, to: FurnitureStatus) => void;
};

function Field({ spec, value, onChange }: { spec: FieldSpec; value: string; onChange: (v: string) => void }) {
  const id = `tr-${spec.name}`;
  const label = (
    <>
      {spec.label}
      {spec.required && <span className="text-accent" aria-hidden> *</span>}
    </>
  );
  const hint = spec.hint && <p className="field-hint">{spec.hint}</p>;

  if (spec.type === "checkbox") {
    return (
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "")} className="h-4 w-4 accent-ink" />
          {label}
        </label>
        {hint}
      </div>
    );
  }
  if (spec.type === "radio" && spec.options) {
    return (
      <fieldset>
        <legend className="field-label">{label}</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(spec.options).map(([k, l]) => (
            <label key={k} className={clsx("flex cursor-pointer items-center gap-2 rounded-ui border px-3 py-2 text-sm", value === k ? "border-ink bg-paper-alt" : "border-line")}>
              <input type="radio" name={spec.name} value={k} checked={value === k} onChange={() => onChange(k)} className="accent-ink" />
              {l}
            </label>
          ))}
        </div>
        {hint}
      </fieldset>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {spec.type === "textarea" ? (
        <textarea id={id} rows={4} value={value} onChange={(e) => onChange(e.target.value)} className="field" />
      ) : (
        <input
          id={id}
          type={spec.type === "date" ? "date" : "text"}
          inputMode={spec.type === "money" ? "decimal" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field"
        />
      )}
      {hint}
    </div>
  );
}

export function TransitionDialog({ target, settings, onClose, onChanged }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<"form" | "email">("form");
  const [emailKey, setEmailKey] = useState<EmailTemplateKey | null>(null);
  const [optionalKey, setOptionalKey] = useState<EmailTemplateKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Réinitialisation synchrone (pendant le rendu) quand la cible change : un useEffect
  // pourrait s'exécuter après une première saisie et l'effacer.
  const [prevTarget, setPrevTarget] = useState<TransitionTarget | null>(null);
  if (target !== prevTarget) {
    setPrevTarget(target);
    if (target) {
      setValues(transitionDefaults(target.to, target.ctx));
      setFiles([]);
      setStep("form");
      setEmailKey(null);
      setOptionalKey(null);
      setError(null);
    }
  }

  if (!target) return null;
  const spec = TRANSITIONS[target.to] ?? { fields: [] };
  const fields = visibleFields(target.to, values);

  // Les valeurs saisies alimentent immédiatement les variables du mail.
  const emailVars = () => {
    const f = { ...target.email.furniture } as EmailFurniture & Record<string, unknown>;
    const num = (v?: string) => (v ? Number(v.replace(/\s/g, "").replace(",", ".")) : null);
    if (target.to === "offer_sent") {
      f.offer_buyout_price = num(values.offer_buyout_price);
      f.expected_sale_price = num(values.expected_sale_price);
      f.transport_cost = num(values.transport_cost);
    }
    if (target.to === "non_conform") {
      f.conformity_report = values.conformity_report || null;
      f.return_quote = num(values.return_quote);
      f.non_conform_at = new Date().toISOString();
    }
    if (target.to === "sold") f.final_sale_price = num(values.final_sale_price);
    const pickup = target.to === "pickup_scheduled" ? { appointment_date: values.pickup_date, period: values.pickup_period } : null;
    return buildEmailVars(f, target.email.brandName, settings, pickup);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await changeStatus(target.furnitureId, target.to, values);
    if (!res.ok) {
      setError(res.error);
      setPending(false);
      return;
    }
    if (files.length) {
      const uploaded = [];
      for (const file of files) {
        try {
          uploaded.push(await uploadFurnitureImage(supabase, target.furnitureId, file));
        } catch {
          setError(`Statut modifié, mais l'envoi de « ${file.name} » a échoué : ajoutez-la depuis la section Conformité.`);
        }
      }
      if (uploaded.length) await registerPhotos(target.furnitureId, "conformity", uploaded);
    }
    onChanged(target.furnitureId, target.to);
    setPending(false);
    const key = spec.email?.(values, target.ctx) ?? null;
    const optional = spec.optionalEmail?.(values, target.ctx) ?? null;
    if (key || optional) {
      setEmailKey(key);
      setOptionalKey(optional);
      setStep("email");
    } else {
      onClose();
    }
  };

  const title =
    step === "email" && emailKey
      ? `Mail « ${EMAIL_TEMPLATES[emailKey].name} »`
      : `${target.furnitureName} → ${STATUS_LABELS[target.to]}`;

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      size={step === "email" ? "xl" : "md"}
      footer={
        step === "form" ? (
          <>
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" form="transition-form" className="btn-primary" disabled={pending}>
              {pending ? "Enregistrement…" : "Valider"}
            </button>
          </>
        ) : (
          <button type="button" className="btn-dark" onClick={onClose}>Terminer</button>
        )
      }
    >
      {step === "form" ? (
        <form id="transition-form" onSubmit={submit} className="space-y-4">
          {spec.intro && <p className="text-sm text-ink-soft">{spec.intro}</p>}
          {!fields.length && !spec.intro && <p className="text-sm text-ink-soft">Confirmer le passage au statut « {STATUS_LABELS[target.to]} » ?</p>}
          {target.to === "preparing" && target.ctx.from === "non_conform" && !target.ctx.nonConformExpired && (
            <p className="rounded-ui bg-paper-alt p-3 text-sm">Le délai de non-conformité n&apos;est pas encore dépassé.</p>
          )}
          {fields.map((f) => (
            <Field key={f.name} spec={f} value={values[f.name] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
          ))}
          {spec.conformityPhotos && (
            <div>
              <label htmlFor="tr-photos" className="field-label">Photos de conformité</label>
              <input id="tr-photos" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="block text-sm" />
              {files.length > 0 && <p className="field-hint">{files.length} photo{files.length > 1 ? "s" : ""} sélectionnée{files.length > 1 ? "s" : ""}</p>}
            </div>
          )}
          {error && <p role="alert" className="field-error text-sm">{error}</p>}
        </form>
      ) : (
        <div className="space-y-4">
          <p className="rounded-ui bg-paper-alt p-3 text-sm">Statut mis à jour : {STATUS_LABELS[target.to]}.</p>
          {error && <p role="alert" className="field-error text-sm">{error}</p>}
          {emailKey ? (
            <EmailComposer furnitureId={target.furnitureId} templateKey={emailKey} vars={emailVars()} to={target.email.furniture.seller_email} />
          ) : (
            optionalKey && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm">Mail facultatif : « {EMAIL_TEMPLATES[optionalKey].name} ».</p>
                <button type="button" className="btn-secondary btn-sm" onClick={() => setEmailKey(optionalKey)}>Préparer le mail</button>
              </div>
            )
          )}
        </div>
      )}
    </Dialog>
  );
}
