/**
 * Textes du formulaire de reprise (/depot et bas de /salon), repris de la page « Vendre ».
 * Le barème n'est pas ici : il vient des réglages (clé consignment_scale).
 */

export const depotContent = {
  intro: {
    eyebrow: "Particuliers",
    title: "Quelques photos, on s'occupe du reste.",
    text: "Vendre seul, c'est des négociations sans fin, des acheteurs fantômes et des inconnus chez soi. Avec Remarq, vous recevez une estimation honnête et vous n'avez plus rien à faire.",
    benefits: [
      { icon: "camera", title: "Estimation gratuite en 48 h", text: "Sur photos, par un architecte spécialiste du design. Sans engagement." },
      { icon: "truck", title: "Enlèvement à domicile", text: "Sur le créneau de votre choix. Votre intérieur est libéré tout de suite." },
      { icon: "euro", title: "Payé 15 jours après la vente", text: "Prix fixé ensemble, prix plancher garanti, diffusion sur nos canaux spécialisés." },
    ],
    scaleTitle: "Notre barème de partage",
    scaleHeaders: ["Prix de vente final", "Vous recevez"],
    scaleNote: "Pourcentage du prix net vendeur. Aucun frais caché.",
  },

  trust: ["Gratuit et sans engagement", "Réponse sous 48 h", "Prix plancher garanti"],
  steps: ["Vos coordonnées", "Vos pièces", "Enlèvement"],

  seller: {
    title: "Faisons connaissance",
    intro: "Pour vous envoyer votre estimation. 30 secondes, promis.",
    phoneHint: "Pour organiser l'enlèvement et vous répondre sur WhatsApp si vous préférez.",
    next: "Décrire mes pièces",
  },

  pieces: {
    title: "Parlez-nous de vos pièces",
    intro: "Plus vous êtes précis, plus l'estimation est juste. Une pièce = un bloc.",
    brandHint: "Vous ne savez pas ? Écrivez « inconnu », on s'en charge.",
    brandPlaceholder: "ex. B&B Italia, Knoll, Charlotte Perriand…",
    modelPlaceholder: "ex. Canapé Camaleonda, LC2…",
    descriptionPlaceholder: "Matière, couleur, dimensions approximatives, éléments fournis (coussins, pieds, notice…)",
    yearPlaceholder: "ex. 2016 ou « années 70 »",
    pricePlaceholder: "ex. 3500",
    priceHint: "Sert à vérifier l'estimation, pas à la fixer.",
    conditionDetailsPlaceholder: "ex. Deux petites marques sur l'accoudoir gauche, aucune faiblesse de structure.",
    photoTips: ["Vue de face", "Vue de 3/4", "Dos", "Étiquette ou marque", "Défauts éventuels"],
    photoHint: "4 à 6 photos recommandées, en lumière naturelle. Formats JPG, PNG, HEIC.",
    addPiece: "Ajouter une autre pièce",
    manyPieces: "Plus de 10 pièces ou un logement entier ? Décrivez les plus belles et précisez-le à l'étape suivante : nous pouvons venir faire l'inventaire.",
  },

  pickup: {
    title: "Organisons l'enlèvement",
    intro: "Où se trouvent vos pièces ? Nous convenons du créneau avec vous ensuite.",
    accessPlaceholder: "ex. escalier étroit, code d'accès, stationnement, plus de 10 pièces à inventorier…",
    submit: "Envoyer ma demande",
  },

  draftSaved: "Brouillon enregistré sur cet appareil",
} as const;

/** Mention affichée sous le bouton de l'étape 1 ; enregistrée avec chaque demande (preuve). */
export const CONTACT_CONSENT_TEXT =
  "En continuant, vous acceptez que Remarq vous recontacte au sujet de votre demande. Aucune revente de vos données.";
