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

  // PROVISOIRE — la page elle-même reprend les textes de lib/content/vendre.ts ;
  // `eyebrow` remplace « Particuliers » au-dessus du titre, `title` sert à l'image de partage.
  hero: {
    eyebrow: "Époqu'Auto Lyon · stand CarJager",
    title: "Vos meubles de design méritent une seconde vie",
  },

  // PROVISOIRE
  lead: {
    title: "Recevez le lien pour plus tard",
    intro: "Laissez-nous votre e-mail : nous vous envoyons le lien du formulaire pour le remplir tranquillement, chez vous.",
    emailLabel: "Votre e-mail",
    consentLabel:
      "J'accepte que Remarq utilise mon e-mail uniquement pour m'envoyer ce lien.",
    submit: "Recevoir le lien",
    submitting: "Envoi…",
    successTitle: "C'est envoyé !",
    successText: "Vous allez recevoir le lien du formulaire par e-mail. Pensez à vérifier vos indésirables.",
    fallbackText: "L'e-mail n'a pas pu partir pour le moment. Voici le lien, à garder :",
  },

  /** Texte enregistré avec chaque consentement (preuve) : à aligner sur la case ci-dessus. */
  consentRecord:
    "J'accepte que Remarq utilise mon e-mail uniquement pour m'envoyer le lien du formulaire.",

  // PROVISOIRE
  email: {
    subject: "Votre lien pour confier vos meubles à Remarq",
    greeting: "Bonjour,",
    body: "Merci pour votre visite sur le stand. Voici le lien pour nous présenter vos meubles de design, quand vous le souhaitez :",
    cta: "Décrire mon meuble",
    signature: "L'équipe Remarq",
    footer: "Vous recevez cet e-mail car vous l'avez demandé sur le stand Remarq. Votre adresse ne sert qu'à cet envoi.",
  },
} as const;

export function parseSource(value: string | null | undefined): SalonSource {
  return (SALON_SOURCES as readonly string[]).includes(value ?? "") ? (value as SalonSource) : "stand";
}
