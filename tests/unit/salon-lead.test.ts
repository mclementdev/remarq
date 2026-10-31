import { describe, expect, it } from "vitest";
import { parseLead, parisLocalToDate } from "@/lib/salon/lead";
import { buildIcs, googleCalendarUrl, toIcsDate } from "@/lib/calendar/ics";
import { buildSalonEmail, formatReminder } from "@/lib/email/salon-email";

const now = new Date("2026-11-07T10:00:00Z");
const valid = { email: " Claire@Exemple.FR ", consent: true, source: "carte" };

describe("validation d'un lead", () => {
  it("accepte un e-mail seul, normalisé, sans rappel", () => {
    expect(parseLead(valid, now)).toEqual({ ok: true, spam: false, email: "claire@exemple.fr", remindAt: null, source: "carte" });
  });

  it("refuse un e-mail invalide", () => {
    expect(parseLead({ ...valid, email: "claire@" }, now)).toMatchObject({ ok: false, field: "email", error: "Adresse e-mail invalide." });
  });

  it("refuse sans consentement", () => {
    expect(parseLead({ email: "a@b.fr", source: "stand" }, now)).toMatchObject({ ok: false, field: "consent" });
    expect(parseLead({ ...valid, consent: false }, now)).toMatchObject({ ok: false, field: "consent" });
  });

  it("date de rappel facultative, en heure de Paris", () => {
    const r = parseLead({ ...valid, remindAt: "2026-11-10T09:30" }, now);
    expect(r.ok && r.remindAt?.toISOString()).toBe("2026-11-10T08:30:00.000Z");
    expect(parseLead({ ...valid, remindAt: "" }, now)).toMatchObject({ ok: true, remindAt: null });
  });

  it("refuse une date de rappel passée ou mal formée", () => {
    expect(parseLead({ ...valid, remindAt: "2026-11-01T09:00" }, now)).toMatchObject({ ok: false, field: "remindAt" });
    expect(parseLead({ ...valid, remindAt: "demain" }, now)).toMatchObject({ ok: false, field: "remindAt" });
  });

  it("source inconnue → stand ; champ piège rempli → spam", () => {
    expect(parseLead({ ...valid, source: "autre" }, now)).toMatchObject({ ok: true, source: "stand" });
    expect(parseLead({ ...valid, website: "http://spam" }, now)).toMatchObject({ ok: true, spam: true });
  });

  it("gère le passage à l'heure d'été", () => {
    expect(parisLocalToDate("2027-04-01T09:00").toISOString()).toBe("2027-04-01T07:00:00.000Z");
  });
});

describe("invitation d'agenda", () => {
  const event = { uid: "abc@remarq.fr", start: new Date("2026-11-10T08:30:00Z"), durationMinutes: 30, title: "Remarq : décrire mon meuble", description: "Lien, avec virgule; et point-virgule", url: "https://remarq-ten.vercel.app/depot" };

  it("produit un .ics valide (CRLF, dates UTC, texte échappé, alarme)", () => {
    const ics = buildIcs(event, now);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261110T083000Z");
    expect(ics).toContain("DTEND:20261110T090000Z");
    expect(ics).toContain("DESCRIPTION:Lien\\, avec virgule\; et point-virgule");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it("replie les lignes longues", () => {
    const ics = buildIcs({ ...event, description: "é".repeat(120) }, now);
    expect(ics).toMatch(/\r\n é/);
  });

  it("lien Google Agenda", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get("dates")).toBe(`${toIcsDate(event.start)}/20261110T090000Z`);
    expect(url.searchParams.get("text")).toBe("Remarq : décrire mon meuble");
  });
});

describe("e-mail du salon", () => {
  it("sans rappel : lien du formulaire, pas de pièce jointe", () => {
    const mail = buildSalonEmail({ to: "a@b.fr", formUrl: "https://x.fr/depot", remindAt: null, leadId: "1", now });
    expect(mail.text).toContain("https://x.fr/depot");
    expect(mail.html).toContain('href="https://x.fr/depot"');
    expect(mail.attachments).toBeUndefined();
  });

  it("avec rappel : .ics joint, date lisible et lien Google Agenda", () => {
    const remindAt = new Date("2026-11-10T08:30:00Z");
    const mail = buildSalonEmail({ to: "a@b.fr", formUrl: "https://x.fr/depot", remindAt, leadId: "1", now });
    expect(formatReminder(remindAt)).toBe("mardi 10 novembre 2026 à 9 h 30");
    expect(mail.text).toContain("mardi 10 novembre 2026 à 9 h 30");
    expect(mail.text).toContain("calendar.google.com");
    expect(mail.attachments?.[0]).toMatchObject({ filename: "rappel-remarq.ics" });
    expect(mail.attachments?.[0].content).toContain("DTSTART:20261110T083000Z");
  });
});
