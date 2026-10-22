"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { SETTING_LABELS, type AppSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [v, setV] = useState(Object.fromEntries(Object.entries(settings).map(([k, val]) => [k, String(val)])) as Record<keyof AppSettings, string>);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const num = (s: string) => Number(s.replace(",", "."));
  const field = (k: keyof AppSettings, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div>
      <label htmlFor={`set-${k}`} className="field-label">{SETTING_LABELS[k]}</label>
      <input id={`set-${k}`} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className="field" {...props} />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const res = await updateSettings({
            shop_name: v.shop_name,
            email_signature: v.email_signature,
            workshop_address: v.workshop_address,
            offer_validity_days: num(v.offer_validity_days),
            hourly_rate: num(v.hourly_rate),
            non_conform_delay_days: num(v.non_conform_delay_days),
          });
          setMsg(res.ok ? { ok: true, text: "Réglages enregistrés ✓" } : { ok: false, text: res.error });
        });
      }}
    >
      {field("shop_name", {}, "Variable {{boutique}} des e-mails.")}
      <div>
        <label htmlFor="set-email_signature" className="field-label">{SETTING_LABELS.email_signature}</label>
        <textarea id="set-email_signature" rows={3} value={v.email_signature} onChange={(e) => setV({ ...v, email_signature: e.target.value })} className="field" />
        <p className="field-hint">Variable {"{{signature}}"} ; peut contenir {"{{boutique}}"}.</p>
      </div>
      {field("workshop_address", { placeholder: "ex. 5 rue de l'Atelier, 93100 Montreuil" }, "Utilisée dans le mail « Non conforme ».")}
      <div className="grid gap-4 sm:grid-cols-3">
        {field("offer_validity_days", { inputMode: "numeric" })}
        {field("non_conform_delay_days", { inputMode: "numeric" })}
        {field("hourly_rate", { inputMode: "decimal" }, "0 € = temps non valorisé dans la marge.")}
      </div>
      <p className="text-xs text-ink-muted">Le taux horaire s&apos;applique à toutes les marges, y compris celles des mois passés.</p>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>Enregistrer</button>
        {msg && <span role="status" className={msg.ok ? "text-sm text-success" : "text-sm text-danger"}>{msg.text}</span>}
      </div>
    </form>
  );
}
