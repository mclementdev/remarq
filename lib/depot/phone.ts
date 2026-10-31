/** Indicatifs proposés (France par défaut). */
export const PHONE_COUNTRIES = [
  { code: "FR", dial: "+33", flag: "🇫🇷", label: "France" },
  { code: "BE", dial: "+32", flag: "🇧🇪", label: "Belgique" },
  { code: "CH", dial: "+41", flag: "🇨🇭", label: "Suisse" },
  { code: "LU", dial: "+352", flag: "🇱🇺", label: "Luxembourg" },
  { code: "MC", dial: "+377", flag: "🇲🇨", label: "Monaco" },
  { code: "DE", dial: "+49", flag: "🇩🇪", label: "Allemagne" },
  { code: "ES", dial: "+34", flag: "🇪🇸", label: "Espagne" },
  { code: "IT", dial: "+39", flag: "🇮🇹", label: "Italie" },
  { code: "GB", dial: "+44", flag: "🇬🇧", label: "Royaume-Uni" },
  { code: "NL", dial: "+31", flag: "🇳🇱", label: "Pays-Bas" },
  { code: "PT", dial: "+351", flag: "🇵🇹", label: "Portugal" },
  { code: "US", dial: "+1", flag: "🇺🇸", label: "États-Unis" },
] as const;

export const DEFAULT_DIAL = "+33";
export const DIAL_CODES = PHONE_COUNTRIES.map((c) => c.dial) as unknown as readonly [string, ...string[]];

/**
 * Indicatif + numéro saisi → format international sans espaces (« +33612345678 »).
 * Le 0 initial national est retiré ; un numéro déjà saisi avec « + » ou « 00 » est gardé tel quel.
 * Renvoie null si le résultat ne ressemble pas à un numéro (8 à 15 chiffres, norme E.164).
 */
export function toInternational(dial: string, number: string): string | null {
  const raw = number.trim();
  let digits = raw.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  let full: string;
  if (digits.startsWith("+")) full = digits;
  else if (digits.startsWith("00")) full = `+${digits.slice(2)}`;
  else {
    digits = digits.replace(/^0/, "");
    full = `${dial}${digits}`;
  }
  const count = full.length - 1;
  return count >= 8 && count <= 15 ? full : null;
}

/** Affichage lisible : « +33612345678 » → « +33 6 12 34 56 78 » ; autres formats inchangés. */
export function formatPhone(phone: string): string {
  const m = phone.match(/^\+33(\d)(\d{8})$/);
  return m ? `+33 ${m[1]} ${m[2].match(/\d{2}/g)!.join(" ")}` : phone;
}
