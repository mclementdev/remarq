"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TransitionDialog, type TransitionTarget } from "@/components/transitions/TransitionDialog";
import { ACTION_LABELS, NEXT_ACTIONS, STATUSES, STATUS_LABELS, type FurnitureStatus } from "@/lib/status";
import type { TransitionContext } from "@/lib/transitions";
import type { AppSettings } from "@/lib/settings";

type Props = {
  furnitureId: string;
  furnitureName: string;
  status: FurnitureStatus;
  ctx: TransitionContext;
  email: TransitionTarget["email"];
  settings: AppSettings;
  /** "header" : boutons du workflow ; "correction" : sélecteur de n'importe quel statut. */
  variant: "header" | "correction";
};

export function StatusActions({ furnitureId, furnitureName, status, ctx, email, settings, variant }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState<TransitionTarget | null>(null);
  const [choice, setChoice] = useState("");
  const open = (to: FurnitureStatus) => setTarget({ furnitureId, furnitureName, to, ctx, email });

  return (
    <>
      {variant === "header" ? (
        NEXT_ACTIONS[status].map((to, i) => (
          <button
            key={to}
            type="button"
            className={to === "refused" || to === "offer_declined" || to === "non_conform" ? "btn-danger btn-sm" : i === 0 ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
            onClick={() => open(to)}
          >
            {ACTION_LABELS[to] ?? STATUS_LABELS[to]}
          </button>
        ))
      ) : (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (choice) open(choice as FurnitureStatus);
          }}
        >
          <div className="min-w-56 flex-1">
            <label htmlFor="status-correction" className="field-label">Changer de statut (correction, retour arrière)</label>
            <select id="status-correction" value={choice} onChange={(e) => setChoice(e.target.value)} className="field">
              <option value="">Choisir un statut…</option>
              {STATUSES.filter((s) => s !== status).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-secondary" disabled={!choice}>Changer</button>
        </form>
      )}
      <TransitionDialog
        target={target}
        settings={settings}
        onClose={() => { setTarget(null); setChoice(""); }}
        onChanged={() => router.refresh()}
      />
    </>
  );
}
