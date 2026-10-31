import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { salonContent } from "@/lib/content/salon";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar/ics";
import type { OutgoingEmail } from "./send";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** « mardi 10 novembre 2026 à 9 h 30 » (heure de Paris). */
export function formatReminder(d: Date) {
  return format(new TZDate(d.getTime(), "Europe/Paris"), "EEEE d MMMM yyyy 'à' H 'h' mm", { locale: fr });
}

/** E-mail « lien du formulaire », avec invitation d'agenda si un rappel est demandé. */
export function buildSalonEmail(opts: { to: string; formUrl: string; remindAt: Date | null; leadId: string; now?: Date }): OutgoingEmail {
  const c = salonContent.email;
  const event = opts.remindAt
    ? { start: opts.remindAt, durationMinutes: 30, title: c.eventTitle, description: c.eventDescription, url: opts.formUrl }
    : null;
  const googleUrl = event ? googleCalendarUrl(event) : null;
  const reminder = opts.remindAt ? `${c.reminderLine} ${formatReminder(opts.remindAt)}.` : null;

  const text = [
    c.greeting,
    "",
    c.body,
    opts.formUrl,
    ...(reminder ? ["", reminder, `${c.calendarCta} : ${googleUrl}`] : []),
    "",
    c.signature,
    "",
    "—",
    c.footer,
  ].join("\n");

  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;border-radius:2px;text-decoration:none;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;font-size:13px;${
      primary ? "background:#c73e1d;color:#ffffff;" : "background:#fffcf3;color:#3a0305;border:1px solid #3a0305;"
    }">${esc(label)}</a>`;

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#faf2db;color:#3a0305;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf2db"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="font-weight:bold;letter-spacing:0.14em;font-size:20px;padding-bottom:24px">REMARQ</td></tr>
<tr><td>
<p style="margin:0 0 16px">${esc(c.greeting)}</p>
<p style="margin:0 0 24px">${esc(c.body)}</p>
<p style="margin:0 0 24px">${button(opts.formUrl, c.cta, true)}</p>
${reminder && googleUrl ? `<p style="margin:0 0 16px">${esc(reminder)}</p><p style="margin:0 0 24px">${button(googleUrl, c.calendarCta, false)}</p>` : ""}
<p style="margin:0 0 32px">${esc(c.signature)}</p>
<p style="margin:0;font-size:12px;color:#6e4a47">${esc(c.footer)}<br><a href="${esc(opts.formUrl)}" style="color:#6e4a47">${esc(opts.formUrl)}</a></p>
</td></tr></table></td></tr></table></body></html>`;

  return {
    to: opts.to,
    subject: c.subject,
    text,
    html,
    attachments: event
      ? [{ filename: "rappel-remarq.ics", content: buildIcs({ uid: `${opts.leadId}@remarq.fr`, ...event }, opts.now), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
      : undefined,
  };
}
