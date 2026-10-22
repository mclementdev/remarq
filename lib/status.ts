/**
 * Statuts du workflow (cahier des charges §6) : source unique.
 * Pour renommer un libellé (ex. « Nouvelle vie »), c'est ici et nulle part ailleurs.
 */
export const STATUSES = [
  "new",
  "info_requested",
  "accepted",
  "offer_sent",
  "offer_accepted",
  "pickup_scheduled",
  "in_transit",
  "received",
  "non_conform",
  "preparing",
  "online",
  "sold",
  "done",
  "refused",
  "offer_declined",
  "returned",
] as const;

export type FurnitureStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<FurnitureStatus, string> = {
  new: "Nouvelle demande",
  info_requested: "Infos demandées",
  accepted: "Accepté — proposition à envoyer",
  offer_sent: "Proposition envoyée",
  offer_accepted: "Proposition acceptée — enlèvement à planifier",
  pickup_scheduled: "Enlèvement planifié",
  in_transit: "En transit",
  received: "Réceptionné — à contrôler",
  non_conform: "Non conforme",
  preparing: "En préparation (mise en ligne)",
  online: "En ligne",
  sold: "Vendu — retrait acheteur à organiser",
  done: "Nouvelle vie", // À CONFIRMER : libellé de clôture
  refused: "Refusé",
  offer_declined: "Proposition déclinée par le client",
  returned: "Restitué au client",
};

/** Libellés courts pour les en-têtes de colonnes et badges. */
export const STATUS_SHORT_LABELS: Record<FurnitureStatus, string> = {
  new: "Nouvelle demande",
  info_requested: "Infos demandées",
  accepted: "Accepté",
  offer_sent: "Proposition envoyée",
  offer_accepted: "Proposition acceptée",
  pickup_scheduled: "Enlèvement planifié",
  in_transit: "En transit",
  received: "Réceptionné",
  non_conform: "Non conforme",
  preparing: "En préparation",
  online: "En ligne",
  sold: "Vendu",
  done: "Nouvelle vie",
  refused: "Refusé",
  offer_declined: "Proposition déclinée",
  returned: "Restitué",
};

export const KANBAN_COLUMNS: FurnitureStatus[] = [
  "new",
  "info_requested",
  "accepted",
  "offer_sent",
  "offer_accepted",
  "pickup_scheduled",
  "in_transit",
  "received",
  "non_conform",
  "preparing",
  "online",
  "sold",
];

export const ARCHIVE_STATUSES: FurnitureStatus[] = ["done", "refused", "offer_declined", "returned"];

export function isArchived(status: FurnitureStatus) {
  return ARCHIVE_STATUSES.includes(status);
}

export function isStatus(value: unknown): value is FurnitureStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

/** Actions proposées dans la fiche selon le statut courant (§7.3). */
export const NEXT_ACTIONS: Record<FurnitureStatus, FurnitureStatus[]> = {
  new: ["accepted", "info_requested", "refused"],
  info_requested: ["accepted", "refused"],
  accepted: ["offer_sent", "refused"],
  offer_sent: ["offer_accepted", "offer_declined"],
  offer_accepted: ["pickup_scheduled"],
  pickup_scheduled: ["in_transit"],
  in_transit: ["received"],
  received: ["preparing", "non_conform"],
  non_conform: ["returned", "preparing"],
  preparing: ["online"],
  online: ["sold"],
  sold: ["done"],
  done: [],
  refused: [],
  offer_declined: [],
  returned: [],
};

/** Libellés des boutons d'action (verbe à l'infinitif). */
export const ACTION_LABELS: Partial<Record<FurnitureStatus, string>> = {
  accepted: "Accepter",
  info_requested: "Demander des infos",
  refused: "Refuser",
  offer_sent: "Envoyer la proposition",
  offer_accepted: "Proposition acceptée",
  offer_declined: "Proposition déclinée",
  pickup_scheduled: "Planifier l'enlèvement",
  in_transit: "Marquer en transit",
  received: "Réceptionner",
  non_conform: "Non conforme",
  preparing: "Conforme — en préparation",
  online: "Mettre en ligne",
  sold: "Marquer vendu",
  done: "Retiré par l'acheteur",
  returned: "Restitué au client",
};
