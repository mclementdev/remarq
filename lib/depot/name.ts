import { itemTypeLabel } from "./item-types";

/** Nom de la fiche composé à partir du formulaire : « Fauteuil ou chauffeuse · Knoll Womb ». */
export function composeName({ itemType, brand, model }: { itemType: string; brand: string; model?: string | null }): string {
  const type = itemTypeLabel(itemType) ?? "Pièce";
  const isUnknown = brand.trim().toLowerCase() === "inconnu";
  const rest = [isUnknown ? null : brand.trim(), model?.trim() || null].filter(Boolean).join(" ");
  return (rest ? `${type} · ${rest}` : type).slice(0, 200);
}
