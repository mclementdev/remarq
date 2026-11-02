import type { PhotoItem } from "./PhotoTile";
import { DEFAULT_CONDITION_SCORE } from "@/lib/depot/condition";

export type PieceState = {
  key: string;
  brand: string;
  model: string;
  itemType: string;
  quantity: string;
  description: string;
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
  conditionScore: DEFAULT_CONDITION_SCORE,
  conditionDetails: "",
  photos: [],
});

export const EMPTY_SELLER = { firstName: "", lastName: "", email: "", phoneDial: "+33", phone: "" };
export type SellerState = typeof EMPTY_SELLER;

export const EMPTY_PICKUP = { street: "", postalCode: "", city: "", floor: "", hasElevator: "", accessNotes: "" };
export type PickupState = typeof EMPTY_PICKUP;
