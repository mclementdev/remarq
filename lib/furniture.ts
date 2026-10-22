import { FLOOR_LABELS, type Floor } from "@/lib/labels";

type SellerLike = {
  seller_street: string;
  seller_postal_code: string;
  seller_city: string;
};

type AccessLike = {
  floor: string | null;
  has_elevator: boolean | null;
  access_notes: string | null;
};

/** « 12 rue des Lilas, 75011 Paris » */
export function sellerAddress(f: SellerLike) {
  return `${f.seller_street}, ${f.seller_postal_code} ${f.seller_city}`;
}

/** « 3e étage, avec ascenseur — escalier étroit » ; chaîne vide si rien n'est connu. */
export function accessText(f: AccessLike) {
  const parts: string[] = [];
  if (f.floor) parts.push(FLOOR_LABELS[f.floor as Floor]);
  if (f.has_elevator !== null) parts.push(f.has_elevator ? "avec ascenseur" : "sans ascenseur");
  let text = parts.join(", ");
  if (f.access_notes) text = text ? `${text} — ${f.access_notes}` : f.access_notes;
  return text;
}

/** Nom court utilisé dans les e-mails : « Fauteuil Safari – Ibisco ». */
export function furnitureLabel(name: string, brandName: string | null) {
  return brandName ? `${name} – ${brandName}` : name;
}
