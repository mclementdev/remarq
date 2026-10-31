import type { Condition } from "@/lib/labels";

export const DEFAULT_CONDITION_SCORE = 7;

/** Note d'état 0–10 saisie par le vendeur → état utilisé par l'équipe et le futur calcul de prix. */
export function conditionFromScore(score: number): Condition {
  if (score >= 9) return "new";
  if (score >= 7) return "very_good";
  if (score >= 4) return "good";
  return "used";
}

/** Libellé court affiché à côté du curseur. */
export function scoreLabel(score: number): string {
  if (score >= 9) return "Comme neuf";
  if (score >= 7) return "Très bon état";
  if (score >= 4) return "Bon état";
  return "Usé";
}

export const SCORE_MARKS = ["0–3 Usé", "4–6 Bon", "7–8 Très bon", "9–10 Comme neuf"] as const;
