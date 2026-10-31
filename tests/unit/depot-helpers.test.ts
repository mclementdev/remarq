import { describe, expect, it } from "vitest";
import { ITEM_TYPES, itemTypesByCategory, itemTypeLabel } from "@/lib/depot/item-types";
import { conditionFromScore, scoreLabel } from "@/lib/depot/condition";
import { toInternational } from "@/lib/depot/phone";
import { composeName } from "@/lib/depot/name";
import { DEFAULT_SCALE, parseScale, scaleLabels } from "@/lib/depot/scale";

describe("types de pièce", () => {
  it("chaque type a une catégorie et apparaît une fois dans les groupes", () => {
    const grouped = itemTypesByCategory().flatMap((g) => g.types.map((t) => t.value));
    expect(grouped.sort()).toEqual(Object.keys(ITEM_TYPES).sort());
    expect(ITEM_TYPES.sofa.category).toBe("seating");
    expect(ITEM_TYPES.sideboard.category).toBe("storage");
  });
  it("libellé inconnu → null", () => {
    expect(itemTypeLabel("bed")).toBeNull();
    expect(itemTypeLabel("lamp")).toBe("Luminaire");
  });
});

describe("note d'état", () => {
  it.each([
    [10, "new", "Comme neuf"],
    [9, "new", "Comme neuf"],
    [8, "very_good", "Très bon état"],
    [7, "very_good", "Très bon état"],
    [6, "good", "Bon état"],
    [4, "good", "Bon état"],
    [3, "used", "Usé"],
    [0, "used", "Usé"],
  ] as const)("%i → %s", (score, condition, label) => {
    expect(conditionFromScore(score)).toBe(condition);
    expect(scoreLabel(score)).toBe(label);
  });
});

describe("téléphone", () => {
  it("retire le 0 national et ajoute l'indicatif", () => {
    expect(toInternational("+33", "06 12 34 56 78")).toBe("+33612345678");
    expect(toInternational("+33", "6.12.34.56.78")).toBe("+33612345678");
    expect(toInternational("+32", "0470 12 34 56")).toBe("+32470123456");
  });
  it("garde un numéro déjà international", () => {
    expect(toInternational("+33", "+41 79 123 45 67")).toBe("+41791234567");
    expect(toInternational("+33", "0041 79 123 45 67")).toBe("+41791234567");
  });
  it("refuse un numéro trop court ou avec des lettres", () => {
    expect(toInternational("+33", "1234")).toBeNull();
    expect(toInternational("+33", "06 12 AB 56 78")).toBeNull();
    expect(toInternational("+33", "")).toBeNull();
  });
});

describe("nom composé", () => {
  it("type · marque modèle", () => {
    expect(composeName({ itemType: "armchair", brand: "Knoll", model: "Womb" })).toBe("Fauteuil ou chauffeuse · Knoll Womb");
    expect(composeName({ itemType: "lamp", brand: "Flos", model: "" })).toBe("Luminaire · Flos");
  });
  it("marque « inconnu » non reprise", () => {
    expect(composeName({ itemType: "chair", brand: "Inconnu" })).toBe("Chaise");
    expect(composeName({ itemType: "chair", brand: "inconnu", model: "Tulip" })).toBe("Chaise · Tulip");
  });
});

describe("barème", () => {
  it("libellés des tranches", () => {
    expect(scaleLabels(DEFAULT_SCALE).map((r) => ({ ...r, label: r.label.replace(/\s/g, " ") }))).toEqual([
      { label: "Moins de 500 €", percent: 40 },
      { label: "500 à 999 €", percent: 50 },
      { label: "1 000 à 2 499 €", percent: 60 },
      { label: "2 500 € et plus", percent: 70 },
    ]);
  });
  it("valeur invalide → barème par défaut", () => {
    expect(parseScale("x")).toEqual(DEFAULT_SCALE);
    expect(parseScale([{ up_to: 500, percent: 40 }])).toEqual(DEFAULT_SCALE); // dernière ligne non ouverte
    expect(parseScale([{ up_to: 900, percent: 40 }, { up_to: 500, percent: 50 }, { up_to: null, percent: 60 }])).toEqual(DEFAULT_SCALE);
    expect(parseScale([{ up_to: null, percent: 55 }])).toEqual([{ up_to: null, percent: 55 }]);
  });
});
