import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { toStoredListings, generateListing } = await import("@/lib/ai/listing");

describe("textes de mise en ligne", () => {
  const out = {
    site: {
      title: "Fauteuil Safari cuir blanc par Ibisco, design italien, années 1970",
      presentation: "Un fauteuil emblématique du design italien.",
      characteristics: [
        { label: "Marque", value: "Ibisco" },
        { label: "Dimensions", value: "L 80 × P 75 × H 70 cm" },
      ],
      missing: ["designer"],
    },
    leboncoin: {
      title: "Fauteuil Safari Ibisco cuir blanc années 70 – design italien vintage authentique",
      description: "Très bon état.\nLivraison par transporteur, frais à la charge de l'acheteur.",
      category: "Ameublement",
      keywords: ["fauteuil", "ibisco", "safari"],
    },
  };

  it("compose le texte site (présentation + caractéristiques)", () => {
    const { site } = toStoredListings(out, "2400");
    expect(site.body).toBe("Un fauteuil emblématique du design italien.\n\nMarque : Ibisco\nDimensions : L 80 × P 75 × H 70 cm");
    expect(site.missing).toEqual(["designer"]);
  });

  it("limite le titre Leboncoin à 70 caractères et reporte le prix", () => {
    const { lbc } = toStoredListings(out, "2400");
    expect(lbc.title.length).toBeLessThanOrEqual(70);
    expect(lbc.price).toBe("2400");
    expect(lbc.keywords).toBe("fauteuil, ibisco, safari");
  });

  it("renvoie une erreur claire sans clé API", async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generateListing({ Nom: "Test" })).rejects.toThrow("ANTHROPIC_API_KEY");
    if (key) process.env.ANTHROPIC_API_KEY = key;
  });
});
