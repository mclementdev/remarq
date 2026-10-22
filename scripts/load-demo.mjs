#!/usr/bin/env node
/**
 * Données de démonstration (facultatives) — Remarq.
 *
 *   npm run db:demo            charge ~36 meubles fictifs sur 12 mois
 *   npm run db:demo -- --remove  supprime toutes les données de démo
 *
 * Toutes les fiches de démo ont un e-mail vendeur en « @demo.remarq.test » :
 * c'est ce marqueur qui permet de les retirer sans toucher aux vraies données.
 * Variables lues : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY (environnement ou .env.local).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO_DOMAIN = "demo.remarq.test";

function env(name) {
  if (process.env[name]) return process.env[name];
  const file = path.join(root, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && m[1] === name) return m[2];
    }
  }
  throw new Error(`Variable ${name} manquante.`);
}

const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), { auth: { persistSession: false } });

async function remove() {
  const { data: rows } = await supabase.from("furnitures").select("id").like("seller_email", `%@${DEMO_DOMAIN}`);
  const ids = (rows ?? []).map((r) => r.id);
  if (!ids.length) return console.log("Aucune donnée de démo à supprimer.");
  const { data: photos } = await supabase.from("photos").select("storage_path, thumb_path").in("furniture_id", ids);
  const paths = (photos ?? []).flatMap((p) => [p.storage_path, p.thumb_path]).filter(Boolean);
  for (let i = 0; i < paths.length; i += 100) await supabase.storage.from("furniture-photos").remove(paths.slice(i, i + 100));
  await supabase.from("brand_suggestions").delete().in("furniture_id", ids);
  const { error } = await supabase.from("furnitures").delete().in("id", ids);
  if (error) throw error;
  console.log(`${ids.length} meubles de démo supprimés.`);
}

// ---------------------------------------------------------------------------
const MODELS = [
  ["Fauteuil Safari", "seating", "Ibisco", "cuir blanc, structure chromée", "Gianni Songia"],
  ["Chaise LC7", "seating", "Cassina", "cuir noir, acier chromé", "Le Corbusier"],
  ["Lounge Chair", "seating", "Vitra", "cuir noir, palissandre", "Charles & Ray Eames"],
  ["Canapé Togo", "seating", "Ligne Roset", "velours côtelé ocre", "Michel Ducaroy"],
  ["Fauteuil Wassily", "seating", "Knoll", "cuir cognac, acier tubulaire", "Marcel Breuer"],
  ["Chaise Panton", "seating", "Vitra", "polypropylène rouge", "Verner Panton"],
  ["Fauteuil Egg", "seating", "Fritz Hansen", "tissu vert", "Arne Jacobsen"],
  ["Table Tulip", "tables_desks", "Knoll", "marbre blanc, fonte laquée", "Eero Saarinen"],
  ["Bureau Tolomeo", "tables_desks", "Acerbis", "noyer", null],
  ["Table basse Eros", "tables_desks", "Kartell", "marbre noir", "Angelo Mangiarotti"],
  ["Enfilade 606", "storage", "Molteni & C", "noyer, laiton", "Gio Ponti"],
  ["Bibliothèque Infinito", "storage", "Cassina", "frêne teinté", "Franco Albini"],
  ["Commode Mobil", "storage", "Kartell", "plastique translucide", "Antonio Citterio"],
  ["Lampe Arco", "lighting_decor", "Flos", "marbre de Carrare, inox", "Achille & Pier Giacomo Castiglioni"],
  ["Lampe Tizio", "lighting_decor", "Artemide", "aluminium noir", "Richard Sapper"],
  ["Suspension PH5", "lighting_decor", "Hay", "aluminium blanc", "Poul Henningsen"],
  ["Fauteuil Ploum", "seating", "Ligne Roset", "tissu gris", "Ronan & Erwan Bouroullec"],
  ["Chaise Thonet n°14", "seating", "Thonet", "hêtre courbé", "Michael Thonet"],
];
const FIRST = ["Claire", "Hugo", "Inès", "Louis", "Manon", "Théo", "Léa", "Jules", "Chloé", "Nathan", "Sarah", "Paul"];
const LAST = ["Bernard", "Petit", "Robert", "Richard", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Michel", "Garcia", "Roux"];
const CITIES = [["75011", "Paris"], ["69006", "Lyon"], ["33000", "Bordeaux"], ["13008", "Marseille"], ["44000", "Nantes"], ["59000", "Lille"]];
const CONDITIONS = ["very_good", "good", "very_good", "used", "new"];

const iso = (d) => d.toISOString();
const day = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86_400_000);
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rand() * a.length)];
const round10 = (n) => Math.round(n / 10) * 10;

const PATH_TO = {
  new: ["new"],
  info_requested: ["new", "info_requested"],
  accepted: ["new", "accepted"],
  offer_sent: ["new", "accepted", "offer_sent"],
  offer_accepted: ["new", "accepted", "offer_sent", "offer_accepted"],
  pickup_scheduled: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled"],
  in_transit: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit"],
  received: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received"],
  non_conform: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "non_conform"],
  preparing: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "preparing"],
  online: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "preparing", "online"],
  sold: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "preparing", "online", "sold"],
  done: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "preparing", "online", "sold", "done"],
  refused: ["new", "refused"],
  offer_declined: ["new", "accepted", "offer_sent", "offer_declined"],
  returned: ["new", "accepted", "offer_sent", "offer_accepted", "pickup_scheduled", "in_transit", "received", "non_conform", "returned"],
};

async function load() {
  const { data: brands } = await supabase.from("brands").select("id, name");
  const brandId = Object.fromEntries((brands ?? []).map((b) => [b.name, b.id]));
  const fixtures = ["meuble-1.jpg", "meuble-2.jpg", "meuble-3.jpg"].map((f) => fs.readFileSync(path.join(root, "tests/e2e/fixtures", f)));
  const now = new Date();

  // 24 meubles terminés (vendus) étalés sur 12 mois + 12 en cours ou archivés.
  const plan = [
    ...Array.from({ length: 24 }, (_, i) => ({ status: i % 3 === 0 ? "sold" : "done", soldDaysAgo: 5 + Math.floor((i / 24) * 340 + rand() * 12) })),
    ...["new", "new", "info_requested", "accepted", "offer_sent", "pickup_scheduled", "received", "non_conform", "preparing", "online", "online", "refused", "offer_declined", "returned"].map((status) => ({ status })),
  ];

  let created = 0;
  for (const [i, p] of plan.entries()) {
    const [name, category, brand, materials, designer] = MODELS[i % MODELS.length];
    const [postal, city] = pick(CITIES);
    const first = pick(FIRST);
    const last = pick(LAST);
    const mode = ["sold", "done", "online", "preparing", "received", "pickup_scheduled", "non_conform", "returned"].includes(p.status) ? (rand() < 0.6 ? "buyout" : "consignment") : null;
    const expected = round10(600 + rand() * 3400);
    const buy = round10(expected * (0.42 + rand() * 0.12));
    const soldAt = p.soldDaysAgo !== undefined ? addDays(now, -p.soldDaysAgo) : null;
    const created_at = addDays(soldAt ?? now, -(soldAt ? 30 + rand() * 40 : 3 + rand() * 25));
    const receivedAt = soldAt ? addDays(soldAt, -(8 + Math.floor(rand() * 40))) : ["received", "non_conform", "preparing", "online", "returned"].includes(p.status) ? addDays(now, -(4 + Math.floor(rand() * 20))) : null;
    const salePrice = soldAt ? round10(expected * (0.9 + rand() * 0.15)) : null;
    const steps = PATH_TO[p.status];
    const stepDates = steps.map((_, k) => addDays(created_at, (k * ((soldAt ?? now) - created_at)) / Math.max(1, steps.length) / 86_400_000));
    const statusChangedAt = p.status === "done" ? addDays(soldAt, 3) : p.status === "sold" ? soldAt : stepDates[stepDates.length - 1];

    const furniture = {
      name,
      category,
      brand_id: brandId[brand] ?? null,
      brand_other: brandId[brand] ? null : brand,
      designer,
      manufacture_year: String(1960 + Math.floor(rand() * 40)),
      description: `${name} ${brand}, acheté il y a quelques années. Très bien entretenu, jamais exposé au soleil.`,
      width_cm: round10(40 + rand() * 160),
      depth_cm: round10(40 + rand() * 60),
      height_cm: round10(40 + rand() * 120),
      materials,
      condition: pick(CONDITIONS),
      defects: rand() < 0.4 ? "Légères traces d'usage sur l'assise." : null,
      desired_price: rand() < 0.6 ? round10(expected * 1.1) : null,
      floor: pick(["ground", "1", "2", "3", "4_plus"]),
      has_elevator: rand() < 0.5,
      seller_first_name: first,
      seller_last_name: last,
      seller_email: `${first}.${last}.${i}@${DEMO_DOMAIN}`.toLowerCase(),
      seller_phone: `06 ${String(10 + i).padStart(2, "0")} 20 30 40`,
      seller_street: `${3 + i} rue de la Démo`,
      seller_postal_code: postal,
      seller_city: city,
      certified_at: iso(created_at),
      certification_text: "Je certifie que ce meuble est authentique et que je suis bien le propriétaire de cet objet.",
      created_at: iso(created_at),
      status: p.status,
      status_changed_at: iso(statusChangedAt),
      mode,
      refusal_reason: p.status === "refused" ? "out_of_selection" : null,
      offer_buyout_price: steps.includes("offer_sent") ? buy : null,
      expected_sale_price: steps.includes("offer_sent") ? expected : null,
      transport_cost: steps.includes("offer_sent") ? round10(80 + rand() * 120) : null,
      final_buyout_price: mode === "buyout" ? buy : null,
      consignment_commission: mode === "consignment" && salePrice ? round10(salePrice * 0.3) : null,
      listed_price: steps.includes("online") ? expected : null,
      final_sale_price: salePrice,
      sale_channel: soldAt ? pick(["site", "leboncoin", "site", "other"]) : null,
      sold_at: soldAt ? day(soldAt) : null,
      received_at: receivedAt ? day(receivedAt) : null,
      non_conform_at: steps.includes("non_conform") ? iso(addDays(now, p.status === "non_conform" ? -9 : -30)) : null,
      conformity_report: steps.includes("non_conform") ? "Fissure non signalée sur le piètement arrière." : null,
      picked_up_by_buyer_at: p.status === "done" ? day(addDays(soldAt, 3)) : null,
      returned_at: p.status === "returned" ? day(addDays(now, -5)) : null,
      published_site: steps.includes("online"),
      published_site_at: steps.includes("online") ? day(addDays(receivedAt ?? now, 5)) : null,
    };

    const { data: f, error } = await supabase.from("furnitures").insert(furniture).select("id").single();
    if (error) throw error;

    await supabase.from("status_history").insert(
      steps.map((s, k) => ({
        furniture_id: f.id,
        from_status: k === 0 ? null : steps[k - 1],
        to_status: s,
        changed_at: iso(s === "sold" && soldAt ? soldAt : s === "done" ? statusChangedAt : stepDates[k]),
        payload: { demo: true },
      })),
    );

    if (soldAt || ["preparing", "online"].includes(p.status)) {
      await supabase.from("time_entries").insert([
        { furniture_id: f.id, type: "cleaning", hours: 1 + Math.floor(rand() * 4) * 0.25, entry_date: day(addDays(receivedAt ?? now, 1)) },
        { furniture_id: f.id, type: "photos", hours: 0.5, entry_date: day(addDays(receivedAt ?? now, 2)) },
      ]);
      await supabase.from("finance_lines").insert({ furniture_id: f.id, label: "Produits d'entretien", amount: -round10(10 + rand() * 30), category: "extra_cost", line_date: day(addDays(receivedAt ?? now, 1)) });
    }
    if (p.status === "pickup_scheduled") {
      await supabase.from("appointments").insert({ furniture_id: f.id, type: "seller_pickup", appointment_date: day(addDays(now, 3)), period: "morning" });
    }
    if (p.status === "sold") {
      await supabase.from("appointments").insert({ furniture_id: f.id, type: "buyer_pickup", appointment_date: day(addDays(now, 6)), period: "afternoon", note: "Acheteur vient avec une camionnette" });
    }

    // 3 photos par meuble (image + vignette).
    const rows = [];
    for (const [k, buf] of fixtures.entries()) {
      const base = `meubles/${f.id}/demo-${k}`;
      await supabase.storage.from("furniture-photos").upload(`${base}.jpg`, buf, { contentType: "image/jpeg", upsert: true });
      await supabase.storage.from("furniture-photos").upload(`${base}_thumb.jpg`, buf, { contentType: "image/jpeg", upsert: true });
      rows.push({ furniture_id: f.id, kind: "deposit", slot: ["front", "back", "side"][k], position: k, is_main: k === 0, storage_path: `${base}.jpg`, thumb_path: `${base}_thumb.jpg` });
    }
    await supabase.from("photos").insert(rows);
    created++;
  }
  console.log(`${created} meubles de démo créés (retirer : npm run db:demo -- --remove).`);
}

(process.argv.includes("--remove") ? remove() : remove().then(load)).catch((e) => {
  console.error("Échec :", e.message ?? e);
  process.exit(1);
});
