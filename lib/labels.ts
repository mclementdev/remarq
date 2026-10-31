/** Libellés français des valeurs d'enum stockées en anglais. */

export const CATEGORY_LABELS = {
  seating: "Assises",
  storage: "Rangements",
  tables_desks: "Tables & Bureaux",
  lighting_decor: "Luminaires & Décoration",
} as const;
export type Category = keyof typeof CATEGORY_LABELS;

export const CONDITION_LABELS = {
  new: "Comme neuf",
  very_good: "Très bon état",
  good: "Bon état",
  used: "Usure visible",
  to_restore: "À restaurer",
} as const;
export type Condition = keyof typeof CONDITION_LABELS;

export const FLOOR_LABELS = {
  ground: "Rez-de-chaussée",
  "1": "1er étage",
  "2": "2e étage",
  "3": "3e étage",
  "4_plus": "4e étage et +",
} as const;
export type Floor = keyof typeof FLOOR_LABELS;

export const MODE_LABELS = {
  buyout: "Rachat",
  consignment: "Dépôt-vente",
} as const;
export type Mode = keyof typeof MODE_LABELS;

export const MODE_LONG_LABELS: Record<Mode, string> = {
  buyout: "Rachat direct",
  consignment: "Dépôt-vente",
};

export const PHOTO_SLOT_LABELS = {
  front: "Face",
  back: "Dos",
  side: "Profil",
  detail: "Détail (signature/étiquette)",
  defect: "Défaut",
  other: "Autre",
} as const;
export type PhotoSlot = keyof typeof PHOTO_SLOT_LABELS;

export const PHOTO_KIND_LABELS = {
  deposit: "Dépôt",
  certificate: "Certificat",
  conformity: "Conformité",
  listing: "Mise en ligne",
} as const;
export type PhotoKind = keyof typeof PHOTO_KIND_LABELS;

export const TIME_TYPE_LABELS = {
  cleaning: "Nettoyage",
  repair: "Réparation",
  photos: "Photos",
  other: "Autre",
} as const;
export type TimeType = keyof typeof TIME_TYPE_LABELS;

export const FINANCE_CATEGORY_LABELS = {
  extra_cost: "Frais annexe",
  adjustment: "Ajustement",
  other: "Autre",
} as const;
export type FinanceCategory = keyof typeof FINANCE_CATEGORY_LABELS;

export const APPOINTMENT_TYPE_LABELS = {
  seller_pickup: "Enlèvement chez le vendeur",
  buyer_pickup: "Retrait acheteur",
  client_return: "Retour au client",
} as const;
export type AppointmentType = keyof typeof APPOINTMENT_TYPE_LABELS;

export const PERIOD_LABELS = {
  morning: "Matin",
  afternoon: "Après-midi",
} as const;
export type Period = keyof typeof PERIOD_LABELS;

export const REFUSAL_REASON_LABELS = {
  out_of_selection: "Hors de notre sélection",
  bad_condition: "État trop dégradé",
  authenticity: "Authenticité non établie",
  bad_timing: "Pas le bon moment",
} as const;
export type RefusalReason = keyof typeof REFUSAL_REASON_LABELS;

export const SALE_CHANNEL_LABELS = {
  site: "Site",
  leboncoin: "Leboncoin",
  other: "Autre",
} as const;
export type SaleChannel = keyof typeof SALE_CHANNEL_LABELS;

export const NON_CONFORM_CHOICE_LABELS = {
  client_pickup: "Le client vient le chercher",
  carrier_return: "Retour par transporteur",
} as const;
export type NonConformChoice = keyof typeof NON_CONFORM_CHOICE_LABELS;

export const CERTIFICATION_TEXT =
  "Je certifie que ce meuble est authentique et que je suis bien le propriétaire de cet objet.";
