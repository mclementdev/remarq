import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const file = path.resolve(__dirname, "../../.env.local");
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

/** Client « clé secrète » pour préparer / vérifier les données des tests (base locale). */
export function adminClient() {
  const env = loadEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
}

export const fixture = (name: string) => path.resolve(__dirname, "fixtures", name);

export const TEST_USER = { email: "martin@remarq.test", password: "remarq-local-1234" };

/** Crée un meuble « Nouvelle demande » directement en base (sans photos). */
export async function createTestFurniture(overrides: Record<string, unknown> = {}) {
  const supabase = adminClient();
  const { data: brand } = await supabase.from("brands").select("id").eq("name", "Cassina").single();
  const name = `Meuble test ${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const { data, error } = await supabase
    .from("furnitures")
    .insert({
      name,
      category: "seating",
      brand_id: brand!.id,
      description: "Créé par les tests de bout en bout.",
      condition: "good",
      seller_first_name: "Paul",
      seller_last_name: "Martin",
      seller_email: "paul.martin@example.com",
      seller_phone: "0601020304",
      seller_street: "3 place du Marché",
      seller_postal_code: "69002",
      seller_city: "Lyon",
      floor: "2",
      has_elevator: false,
      certified_at: new Date().toISOString(),
      certification_text: "Je certifie que ce meuble est authentique et que je suis bien le propriétaire de cet objet.",
      ...overrides,
    })
    .select("id, name")
    .single();
  if (error) throw error;
  await supabase.from("status_history").insert({ furniture_id: data.id, to_status: "new", payload: {} });
  return data as { id: string; name: string };
}
