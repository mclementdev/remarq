import { describe, expect, it } from "vitest";
import { buildEmailVars, findPlaceholders, renderEmail } from "@/lib/emails/render";
import { EMAIL_TEMPLATES, EMAIL_TEMPLATE_KEYS } from "@/lib/emails/templates";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const furniture = {
  name: "Fauteuil Safari",
  seller_first_name: "Claire",
  seller_phone: "06 12 34 56 78",
  seller_street: "12 rue des Lilas",
  seller_postal_code: "75011",
  seller_city: "Paris",
  floor: "3",
  has_elevator: true,
  access_notes: null,
  mode: "buyout",
  offer_buyout_price: 1200,
  expected_sale_price: 2400,
  transport_cost: 150,
  conformity_report: null,
  return_quote: null,
  non_conform_at: null,
  final_sale_price: null,
};

describe("modèles d'e-mails", () => {
  it("contient les 10 modèles dont 4 refus et 2 optionnels", () => {
    expect(EMAIL_TEMPLATE_KEYS).toHaveLength(10);
    expect(EMAIL_TEMPLATE_KEYS.filter((k) => k.startsWith("refusal_"))).toHaveLength(4);
    expect(Object.values(EMAIL_TEMPLATES).filter((t) => t.optional)).toHaveLength(2);
  });

  it("remplace les variables, y compris {{boutique}} dans la signature", () => {
    const vars = buildEmailVars(furniture, "Ibisco", DEFAULT_SETTINGS);
    const mail = renderEmail("offer", vars);
    expect(mail.subject).toBe("Votre Fauteuil Safari – Ibisco : nos deux propositions");
    expect(mail.body).toContain("Bonjour Claire,");
    expect(mail.body).toContain("pour 1 200 € TTC");
    expect(mail.body).toContain("au prix de 2 400 € TTC");
    expect(mail.body).toContain("Son coût, 150 € TTC");
    expect(mail.body).toContain("valable 7 jours");
    expect(mail.body).toMatch(/L'équipe Remarq$/);
    expect(mail.body).not.toContain("{{");
  });

  it("signale les variables manquantes comme zones à compléter", () => {
    const vars = buildEmailVars(furniture, "Ibisco", DEFAULT_SETTINGS);
    const mail = renderEmail("pickup_confirmation", vars);
    expect(mail.subject).toContain("[à compléter : date d'enlèvement]");
    expect(findPlaceholders(mail.body)).toContain("[à compléter : créneau]");
  });

  it("construit le mail de confirmation avec rendez-vous et accès", () => {
    const vars = buildEmailVars(furniture, "Ibisco", DEFAULT_SETTINGS, { appointment_date: "2026-10-27", period: "afternoon" });
    const mail = renderEmail("pickup_confirmation", vars);
    expect(mail.subject).toBe("Enlèvement de votre Fauteuil Safari – Ibisco confirmé — mardi 27 octobre 2026");
    expect(mail.body).toContain("Date : mardi 27 octobre 2026, après-midi");
    expect(mail.body).toContain("Adresse : 12 rue des Lilas, 75011 Paris");
    expect(mail.body).toContain("Formule choisie : Rachat direct");
    expect(mail.body).toContain("3e étage, avec ascenseur");
    expect(findPlaceholders(mail.body)).toEqual([]);
  });

  it("le mail Non conforme utilise le délai paramétré et la date limite", () => {
    const vars = buildEmailVars(
      { ...furniture, conformity_report: "Rayure profonde sur l'accoudoir.", return_quote: 90, non_conform_at: "2026-10-01T14:00:00Z" },
      "Ibisco",
      { ...DEFAULT_SETTINGS, workshop_address: "5 rue de l'Atelier, 93100 Montreuil" },
    );
    const mail = renderEmail("non_conform", vars);
    expect(mail.body).toContain("Rayure profonde sur l'accoudoir.");
    expect(mail.body).toContain("Vous disposez de 15 jours");
    expect(mail.body).toContain("jusqu'au vendredi 16 octobre 2026");
    expect(mail.body).toContain("devis : 90 € TTC");
    expect(findPlaceholders(mail.body)).toEqual(["[à valider avec le contrat]"]);
  });

  it("détecte les zones [à compléter : …] des modèles", () => {
    const vars = buildEmailVars(furniture, "Ibisco", DEFAULT_SETTINGS);
    expect(findPlaceholders(renderEmail("info_request", vars).body)).toHaveLength(1);
  });
});
