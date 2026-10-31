import type { PhotoItem } from "./PhotoTile";
import { DEFAULT_CONDITION_SCORE } from "@/lib/depot/condition";

export type PieceState = {
  key: string;
  brand: string;
  model: string;
  itemType: string;
  quantity: string;
  description: string;
  purchaseYear: string;
  originalPrice: string;
  conditionScore: number;
  conditionDetails: string;
  photos: PhotoItem[];
};

export const emptyPiece = (): PieceState => ({
  key: crypto.randomUUID(),
  brand: "",
  model: "",
  itemType: "",
  quantity: "1",
  description: "",
  purchaseYear: "",
  originalPrice: "",
  conditionScore: DEFAULT_CONDITION_SCORE,
  conditionDetails: "",
  photos: [],
});

export const EMPTY_SELLER = { firstName: "", lastName: "", email: "", phoneDial: "+33", phone: "" };
export type SellerState = typeof EMPTY_SELLER;

export const EMPTY_PICKUP = { street: "", postalCode: "", city: "", floor: "", hasElevator: "", accessNotes: "" };
export type PickupState = typeof EMPTY_PICKUP;

/** "1 200,50" → 1200.5 ; vide → null ; invalide → NaN (rejeté par Zod). */
export function parseNumber(v: string): number | null {
  const s = v.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
