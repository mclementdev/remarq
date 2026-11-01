import { salonContent } from "@/lib/content/salon";
import type { OutgoingEmail } from "./send";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** E-mail « lien du formulaire ». */
export function buildSalonEmail(opts: { to: string; formUrl: string }): OutgoingEmail {
  const c = salonContent.email;

  const text = [
    c.greeting,
    "",
    c.body,
    opts.formUrl,
    "",
    c.signature,
    "",
    "—",
    c.footer,
  ].join("\n");

  const button = (href: string, label: string) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;border-radius:2px;text-decoration:none;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;font-size:13px;background:#c73e1d;color:#ffffff;">${esc(label)}</a>`;

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#faf2db;color:#3a0305;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf2db"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="font-weight:bold;letter-spacing:0.14em;font-size:20px;padding-bottom:24px">REMARQ</td></tr>
<tr><td>
<p style="margin:0 0 16px">${esc(c.greeting)}</p>
<p style="margin:0 0 24px">${esc(c.body)}</p>
<p style="margin:0 0 24px">${button(opts.formUrl, c.cta)}</p>
<p style="margin:0 0 32px">${esc(c.signature)}</p>
<p style="margin:0;font-size:12px;color:#6e4a47">${esc(c.footer)}<br><a href="${esc(opts.formUrl)}" style="color:#6e4a47">${esc(opts.formUrl)}</a></p>
</td></tr></table></td></tr></table></body></html>`;

  return { to: opts.to, subject: c.subject, text, html };
}
