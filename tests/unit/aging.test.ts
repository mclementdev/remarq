import { describe, expect, it } from "vitest";
import { agingLabel, daysSince, formatDuration, nonConformCounter, statusDurations } from "@/lib/calc/aging";

describe("daysSince (jours calendaires Europe/Paris)", () => {
  it("vaut 0 le jour même", () => {
    expect(daysSince("2026-10-21T06:00:00Z", new Date("2026-10-21T20:00:00Z"))).toBe(0);
  });

  it("compte en jours calendaires de Paris, pas en tranches de 24 h", () => {
    // 21/10 23:30 à Paris (21:30Z) → 22/10 00:30 à Paris (22:30Z) : 1 jour, 1 heure plus tard.
    expect(daysSince("2026-10-21T21:30:00Z", new Date("2026-10-21T22:30:00Z"))).toBe(1);
    // 22:30Z le 21 est déjà le 22 à Paris : même jour que 23:00Z.
    expect(daysSince("2026-10-21T22:30:00Z", new Date("2026-10-21T23:00:00Z"))).toBe(0);
  });

  it("traverse le passage à l'heure d'hiver sans décalage", () => {
    // Heure d'hiver le 25/10/2026.
    expect(daysSince("2026-10-24T10:00:00Z", new Date("2026-10-26T10:00:00Z"))).toBe(2);
    expect(daysSince("2026-03-28T23:30:00Z", new Date("2026-03-30T08:00:00Z"))).toBe(1);
  });

  it("accepte une date seule", () => {
    expect(daysSince("2026-10-01", new Date("2026-10-21T10:00:00Z"))).toBe(20);
  });

  it("libellé lisible", () => {
    const now = new Date("2026-10-21T10:00:00Z");
    expect(agingLabel("2026-10-21T08:00:00Z", now)).toBe("depuis aujourd'hui");
    expect(agingLabel("2026-10-20T08:00:00Z", now)).toBe("depuis 1 jour");
    expect(agingLabel("2026-10-11T08:00:00Z", now)).toBe("depuis 10 jours");
  });
});

describe("nonConformCounter (J+X / 15)", () => {
  const start = "2026-10-01T14:00:00Z"; // 01/10 16:00 à Paris

  it("démarre à J+0 le jour du passage", () => {
    const c = nonConformCounter(start, 15, new Date("2026-10-01T20:00:00Z"));
    expect(c.label).toBe("J+0 / 15");
    expect(c.deadline).toBe("2026-10-16");
    expect(c.expired).toBe(false);
  });

  it("n'est pas dépassé le jour de la date limite", () => {
    const c = nonConformCounter(start, 15, new Date("2026-10-16T21:00:00Z")); // 16/10 23:00 Paris
    expect(c.day).toBe(15);
    expect(c.expired).toBe(false);
  });

  it("est dépassé le lendemain de la date limite à minuit (Paris)", () => {
    const c = nonConformCounter(start, 15, new Date("2026-10-16T22:05:00Z")); // 17/10 00:05 Paris
    expect(c.day).toBe(16);
    expect(c.label).toBe("J+16 / 15");
    expect(c.expired).toBe(true);
  });

  it("respecte un délai paramétré", () => {
    const c = nonConformCounter(start, 7, new Date("2026-10-09T10:00:00Z"));
    expect(c.deadline).toBe("2026-10-08");
    expect(c.expired).toBe(true);
  });
});

describe("statusDurations", () => {
  it("calcule le temps passé dans chaque statut", () => {
    const spans = statusDurations(
      [
        { to_status: "accepted", changed_at: "2026-10-02T10:00:00Z" },
        { to_status: "new", changed_at: "2026-10-01T10:00:00Z" },
      ],
      new Date("2026-10-05T10:00:00Z"),
    );
    expect(spans.map((s) => s.status)).toEqual(["new", "accepted"]);
    expect(spans[0].days).toBe(1);
    expect(spans[1].days).toBe(3);
    expect(spans[1].to).toBeNull();
  });

  it("formate les durées", () => {
    expect(formatDuration(5 * 60_000)).toBe("5 min");
    expect(formatDuration(5 * 3_600_000)).toBe("5 h");
    expect(formatDuration(76 * 3_600_000)).toBe("3 j 4 h");
  });
});
