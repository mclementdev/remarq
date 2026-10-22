import { z } from "zod";
import { CERTIFICATION_TEXT } from "@/lib/labels";

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;
export const MAX_CERTIFICATES = 3;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const optionalText = (max = 2000) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));
const optionalAmount = z.number().nonnegative().max(10_000_000).nullish().transform((v) => v ?? null);
const optionalDimension = z.number().positive().max(10_000).nullish().transform((v) => v ?? null);

export const uploadedPhotoSchema = z.object({
  path: z.string().min(1).max(300),
  thumbPath: z.string().min(1).max(300),
  slot: z.enum(["front", "back", "side", "detail", "defect", "other"]),
});

export const depotSchema = z
  .object({
    submissionId: z.uuid(),

    // A. Le meuble
    name: z.string().trim().min(1, "Indiquez le nom ou le modèle du meuble.").max(200),
    category: z.enum(["seating", "storage", "tables_desks", "lighting_decor"], {
      error: "Choisissez une catégorie.",
    }),
    brandId: z.uuid().nullish(),
    brandOther: optionalText(120),
    designer: optionalText(120),
    manufactureYear: optionalText(40),
    description: z.string().trim().min(1, "Décrivez rapidement le meuble.").max(5000),
    widthCm: optionalDimension,
    depthCm: optionalDimension,
    heightCm: optionalDimension,
    materials: optionalText(300),
    condition: z.enum(["new", "very_good", "good", "used", "to_restore"], { error: "Indiquez l'état du meuble." }),
    defects: optionalText(3000),
    purchaseYear: optionalText(40),
    originalPrice: optionalAmount,
    desiredPrice: optionalAmount,

    // B. Enlèvement
    floor: z.enum(["ground", "1", "2", "3", "4_plus"]).nullish().transform((v) => v ?? null),
    hasElevator: z.boolean().nullish().transform((v) => v ?? null),
    accessNotes: optionalText(1000),

    // C. Coordonnées
    firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(100),
    lastName: z.string().trim().min(1, "Indiquez votre nom.").max(100),
    email: z.email("Adresse e-mail invalide.").max(200),
    phone: z
      .string()
      .trim()
      .min(6, "Numéro de téléphone invalide.")
      .max(30)
      .regex(/^[+0-9 ().-]+$/, "Numéro de téléphone invalide."),
    street: z.string().trim().min(1, "Indiquez votre adresse.").max(300),
    postalCode: z.string().trim().min(4, "Code postal invalide.").max(10),
    city: z.string().trim().min(1, "Indiquez votre ville.").max(120),

    // D. Certification
    certified: z.literal(true, { error: "Vous devez cocher la case de certification." }),

    photos: z
      .array(uploadedPhotoSchema)
      .min(MIN_PHOTOS, `Ajoutez au moins ${MIN_PHOTOS} photos du meuble.`)
      .max(MAX_PHOTOS, `${MAX_PHOTOS} photos maximum.`),
    certificates: z.array(uploadedPhotoSchema).max(MAX_CERTIFICATES, `${MAX_CERTIFICATES} images maximum pour le certificat.`),
  })
  .refine((d) => d.brandId || d.brandOther, {
    message: "Choisissez une marque ou précisez-la.",
    path: ["brandId"],
  });

export type DepotInput = z.input<typeof depotSchema>;
export type DepotData = z.output<typeof depotSchema>;

export { CERTIFICATION_TEXT };
