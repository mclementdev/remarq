/**
 * Textes de la landing du salon (/salon) et de l'e-mail envoyé.
 * Tous les textes sont modifiables ici, et seulement ici.
 *
 * ⚠️ PROVISOIRE : textes rédigés par Claude Code en attendant ceux de Remarq.
 * Remplacez chaque bloc marqué « PROVISOIRE » puis supprimez la mention.
 */

export const SALON_SOURCES = ["stand", "carte", "flyer", "ig", "carjager"] as const;
export type SalonSource = (typeof SALON_SOURCES)[number];

/** Sources « sur place » : on met en avant l'envoi du lien par e-mail. */
export const ON_SITE_SOURCES: SalonSource[] = ["stand", "carte", "flyer"];

export const salonContent = {
  // PROVISOIRE
  meta: {
    title: "Confiez-nous vos meubles de design",
    description: "Remarq reprend vos meubles de designer dont vous ne vous servez plus : rachat ou dépôt-vente, enlèvement organisé.",
    /** Sous-titre de l'image de partage (réseaux sociaux, messageries). */
    shareTagline: "Rachat ou dépôt-vente · enlèvement organisé",
  },

  // PROVISOIRE
  hero: {
    eyebrow: "Époqu'Auto Lyon · stand CarJager",
    title: "Vos meubles de design méritent une seconde vie",
    promise: "Décrivez votre pièce en quelques minutes. Nous vous faisons une proposition de rachat ou de dépôt-vente, et nous organisons l'enlèvement.",
  },

  // PROVISOIRE
  steps: [
    { title: "Vous décrivez votre meuble", text: "Quelques photos et informations, depuis votre téléphone." },
    { title: "Nous vous faisons une proposition", text: "Rachat direct ou dépôt-vente, à vous de choisir." },
    { title: "Nous venons le chercher", text: "Enlèvement chez vous, sur le créneau qui vous convient." },
  ],

  // PROVISOIRE
  lead: {
    title: "Recevez le lien pour plus tard",
    intro: "Laissez-nous votre e-mail : nous vous envoyons le lien du formulaire pour le remplir tranquillement, chez vous.",
    emailLabel: "Votre e-mail",
    reminderLabel: "Me le rappeler le (facultatif)",
    reminderHint: "Vous recevrez une invitation à ajouter à votre agenda.",
    consentLabel:
      "J'accepte que Remarq utilise mon e-mail uniquement pour m'envoyer ce lien et ce rappel.",
    submit: "Recevoir le lien",
    submitting: "Envoi…",
    successTitle: "C'est envoyé !",
    successText: "Vous allez recevoir le lien du formulaire par e-mail. Pensez à vérifier vos indésirables.",
    fallbackText: "L'e-mail n'a pas pu partir pour le moment. Voici le lien, à garder :",
  },

  /** Texte enregistré avec chaque consentement (preuve) : à aligner sur la case ci-dessus. */
  consentRecord:
    "J'accepte que Remarq utilise mon e-mail uniquement pour m'envoyer le lien du formulaire et le rappel demandé.",

  // PROVISOIRE
  form: {
    ctaNow: "Remplir le formulaire maintenant",
    title: "Décrivez votre meuble",
    intro: "Comptez cinq minutes et trois photos minimum.",
  },

  // PROVISOIRE
  email: {
    subject: "Votre lien pour confier vos meubles à Remarq",
    greeting: "Bonjour,",
    body: "Merci pour votre visite sur le stand. Voici le lien pour nous présenter vos meubles de design, quand vous le souhaitez :",
    cta: "Décrire mon meuble",
    reminderLine: "Comme demandé, l'invitation jointe vous le rappellera le",
    calendarCta: "Ajouter à Google Agenda",
    signature: "L'équipe Remarq",
    footer: "Vous recevez cet e-mail car vous l'avez demandé sur le stand Remarq. Votre adresse ne sert qu'à cet envoi.",
    eventTitle: "Remarq : décrire mon meuble",
    eventDescription: "Le formulaire pour confier vos meubles à Remarq :",
  },
} as const;

export function parseSource(value: string | null | undefined): SalonSource {
  return (SALON_SOURCES as readonly string[]).includes(value ?? "") ? (value as SalonSource) : "stand";
}
