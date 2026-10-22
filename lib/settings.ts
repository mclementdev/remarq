import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type AppSettings = {
  shop_name: string;
  email_signature: string;
  workshop_address: string;
  offer_validity_days: number;
  hourly_rate: number;
  non_conform_delay_days: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  shop_name: "Remarq",
  email_signature: "L'équipe {{boutique}}",
  workshop_address: "",
  offer_validity_days: 7,
  hourly_rate: 0,
  non_conform_delay_days: 15,
};

export const SETTING_LABELS: Record<keyof AppSettings, string> = {
  shop_name: "Nom de la boutique",
  email_signature: "Signature des e-mails",
  workshop_address: "Adresse de l'atelier (retrait des non conformes)",
  offer_validity_days: "Délai de validité des propositions (jours)",
  hourly_rate: "Taux horaire (€ TTC / h)",
  non_conform_delay_days: "Délai de non-conformité (jours)",
};

export async function getSettings(supabase: SupabaseClient<Database>): Promise<AppSettings> {
  const { data } = await supabase.from("settings").select("key, value");
  const settings = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const row of data ?? []) {
    if (row.key in DEFAULT_SETTINGS) {
      const def = DEFAULT_SETTINGS[row.key as keyof AppSettings];
      settings[row.key] = typeof def === "number" ? Number(row.value) || 0 : String(row.value ?? "");
    }
  }
  return settings as AppSettings;
}
