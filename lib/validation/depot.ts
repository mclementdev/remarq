import { z } from "zod";
import { CERTIFICATION_TEXT } from "@/lib/labels";
import { ITEM_TYPE_KEYS } from "@/lib/depot/item-types";
import { DIAL_CODES, toInternational } from "@/lib/depot/phone";
import { SALON_SOURCES } from "@/lib/content/salon";

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;
export const MAX_PIECES = 10;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const optionalText = (max = 2000) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
const optionalAmount = z.number().nonnegative().max(10_000_000).nullish().transform((v) => v ?? null);

export const uploadedPhotoSchema = z.object({
  path: z.string().min(1).max(300),
  thumbPath: z.string().min(1).max(300),
  slot: z.enum(["front", "back", "side", "detail", "defect", "other"]),
});

// ------------------------------------------------------------ étape 1
export const sellerStepSchema = z
  .object({
    firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(100),
    lastName: optionalText(100),
    email: z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide.").max(200)),
    phoneDial: z.enum(DIAL_CODES).catch("+33"),
    phone: z.string().trim().min(1, "Indiquez votre téléphone.").max(30),
  })
  .transform((d, ctx) => {
    const phone = toInternational(d.phoneDial, d.phone);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Numéro de téléphone invalide.", path: ["phone"] });
      return z.NEVER;
    }
    return { ...d, phone };
  });

// ------------------------------------------------------------ étape 2 (une pièce)
export const pieceSchema = z.object({
  brand: z.string().trim().min(1, "Indiquez la marque ou le designer (ou « inconnu »).").max(120),
  model: optionalText(200),
  itemType: z.enum(ITEM_TYPE_KEYS, { error: "Choisissez le type de pièce." }),
  quantity: z.number({ error: "Indiquez la quantité." }).int("Quantité invalide.").min(1, "Quantité invalide.").max(99, "99 maximum."),
  description: z.string().trim().min(1, "Décrivez la pièce.").max(5000),
  purchaseYear: optionalText(40),
  originalPrice: optionalAmount,
  conditionScore: z.number().int().min(0).max(10),
  conditionDetails: optionalText(3000),
  photos: z
    .array(uploadedPhotoSchema)
    .min(MIN_PHOTOS, `Ajoutez au moins ${MIN_PHOTOS} photos de cette pièce.`)
    .max(MAX_PHOTOS, `${MAX_PHOTOS} photos maximum par pièce.`),
});

// ------------------------------------------------------------ étape 3
export const pickupStepSchema = z.object({
  street: z.string().trim().min(1, "Indiquez l'adresse.").max(300),
  postalCode: z.string().trim().min(4, "Code postal invalide.").max(10),
  city: z.string().trim().min(1, "Indiquez la ville.").max(120),
  floor: z.enum(["ground", "1", "2", "3", "4_plus"]).nullish().transform((v) => v ?? null),
  hasElevator: z.boolean().nullish().transform((v) => v ?? null),
  accessNotes: optionalText(1000),
  certified: z.literal(true, { error: "Vous devez cocher la case de certification." }),
});

// ------------------------------------------------------------ demande complète
export const depotSchema = z
  .object({
    submissionId: z.uuid(),
    source: z.enum(SALON_SOURCES).nullish().catch(null).transform((v) => v ?? null),
    seller: sellerStepSchema,
    pieces: z.array(pieceSchema).min(1, "Ajoutez au moins une pièce.").max(MAX_PIECES, `${MAX_PIECES} pièces maximum par demande.`),
    pickup: pickupStepSchema,
  })
  .refine(
    (d) => {
      const paths = d.pieces.flatMap((p) => p.photos.flatMap((ph) => [ph.path, ph.thumbPath]));
      return new Set(paths).size === paths.length;
    },
    { message: "Une même photo ne peut pas servir à deux pièces.", path: ["pieces"] },
  );

export type DepotInput = z.input<typeof depotSchema>;
export type DepotData = z.output<typeof depotSchema>;
export type PieceData = z.output<typeof pieceSchema>;

export { CERTIFICATION_TEXT };
