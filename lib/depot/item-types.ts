import type { Category } from "@/lib/labels";

/** Types de pièce du formulaire, alignés sur l'arborescence du site (catégorie → sous-catégorie). */
export const ITEM_TYPES = {
  chair: { label: "Chaise", category: "seating" },
  sofa: { label: "Canapé", category: "seating" },
  armchair: { label: "Fauteuil ou chauffeuse", category: "seating" },
  stool_bench: { label: "Tabouret ou banc", category: "seating" },
  table: { label: "Table", category: "tables_desks" },
  desk: { label: "Bureau", category: "tables_desks" },
  side_table: { label: "Desserte ou meuble d'appoint", category: "tables_desks" },
  bookcase: { label: "Bibliothèque", category: "storage" },
  shelf: { label: "Étagère", category: "storage" },
  chest: { label: "Commode", category: "storage" },
  sideboard: { label: "Enfilade", category: "storage" },
  mirror: { label: "Miroir", category: "lighting_decor" },
  small_object: { label: "Petit objet", category: "lighting_decor" },
  lamp: { label: "Luminaire", category: "lighting_decor" },
  vase: { label: "Vase", category: "lighting_decor" },
  rug: { label: "Tapis", category: "lighting_decor" },
} as const satisfies Record<string, { label: string; category: Category }>;

export type ItemType = keyof typeof ITEM_TYPES;
export const ITEM_TYPE_KEYS = Object.keys(ITEM_TYPES) as [ItemType, ...ItemType[]];

export function isItemType(value: unknown): value is ItemType {
  return typeof value === "string" && value in ITEM_TYPES;
}

export function itemTypeLabel(value: string | null | undefined): string | null {
  return isItemType(value) ? ITEM_TYPES[value].label : null;
}

/** Types regroupés par catégorie, dans l'ordre d'affichage (liste déroulante). */
export function itemTypesByCategory(): { category: Category; types: { value: ItemType; label: string }[] }[] {
  const order: Category[] = ["seating", "tables_desks", "storage", "lighting_decor"];
  return order.map((category) => ({
    category,
    types: ITEM_TYPE_KEYS.filter((k) => ITEM_TYPES[k].category === category).map((value) => ({ value, label: ITEM_TYPES[value].label })),
  }));
}
