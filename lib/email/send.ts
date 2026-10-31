import "server-only";
import { Resend } from "resend";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
};

export type SendResult = { ok: true; logged: boolean } | { ok: false; error: string };

/**
 * Envoi transactionnel via Resend. Sans RESEND_API_KEY (local, prévisualisations),
 * l'e-mail est journalisé au lieu d'être envoyé.
 */
export async function sendEmail(mail: OutgoingEmail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Remarq <contact@remarq.fr>";
  if (!key) {
    console.info(
      `[e-mail non envoyé : RESEND_API_KEY absente] à=${mail.to} objet="${mail.subject}" pièces=${mail.attachments?.map((a) => a.filename).join(",") || "aucune"}\n${mail.text}`,
    );
    return { ok: true, logged: true };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      attachments: mail.attachments,
    });
    if (error) return { ok: false, error: `${error.name}: ${error.message}` };
    return { ok: true, logged: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
