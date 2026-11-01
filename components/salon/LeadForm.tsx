"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { salonContent, type SalonSource } from "@/lib/content/salon";

type State =
  | { step: "form" }
  | { step: "done"; emailSent: boolean; formUrl: string };

/** CTA « Recevez le lien pour plus tard » : e-mail et consentement. */
export function LeadForm({ source }: { source: SalonSource }) {
  const t = salonContent.lead;
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<{ field?: string; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<State>({ step: "form" });

  if (state.step === "done") {
    return (
      <div role="status" className="space-y-3 rounded-ui border border-success bg-paper p-5">
        <p className="text-lg font-bold text-success">✓ {t.successTitle}</p>
        {state.emailSent ? (
          <p>{t.successText}</p>
        ) : (
          <>
            <p>{t.fallbackText}</p>
            <a href={state.formUrl} className="break-all underline">{state.formUrl}</a>
          </>
        )}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    if (!consent) {
      setErrors({ field: "consent", message: "Merci d'accepter l'utilisation de votre e-mail." });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/salon/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source, website }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ field: body.field, message: body.error ?? "L'envoi a échoué. Réessayez." });
      } else {
        setState({ step: "done", emailSent: !!body.emailSent, formUrl: body.formUrl });
      }
    } catch {
      setErrors({ message: "Connexion impossible. Vérifiez votre réseau puis réessayez." });
    } finally {
      setPending(false);
    }
  };

  const errorFor = (field: string) =>
    errors?.field === field ? <p id={`lead-${field}-error`} className="field-error">{errors.message}</p> : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="lead-email" className="field-label">
          {t.emailLabel}<span className="text-accent" aria-hidden> *</span>
        </label>
        <input
          id="lead-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors?.field === "email"}
          aria-describedby={errors?.field === "email" ? "lead-email-error" : undefined}
          className={clsx("field py-3 text-base", errors?.field === "email" && "border-danger")}
        />
        {errorFor("email")}
      </div>

      {/* Champ piège pour les robots : invisible et ignoré par les lecteurs d'écran. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="lead-website">Site web</label>
        <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <label className={clsx("flex cursor-pointer items-start gap-3 rounded-ui border bg-paper p-3 text-sm", errors?.field === "consent" ? "border-danger" : "border-line")}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-describedby={errors?.field === "consent" ? "lead-consent-error" : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
        />
        <span>
          {t.consentLabel}<span className="text-accent" aria-hidden> *</span>{" "}
          <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
        </span>
      </label>
      {errorFor("consent")}

      {errors && !["email", "consent"].includes(errors.field ?? "") && (
        <p role="alert" className="rounded-ui border border-danger bg-paper p-3 text-sm text-danger">{errors.message}</p>
      )}

      <button type="submit" className="btn-primary w-full py-4 text-sm" disabled={pending}>
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
