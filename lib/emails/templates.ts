/**
 * Modèles d'e-mails à copier/coller (EMAILS_MODELES.md). Aucun envoi depuis l'outil.
 * Variables : {{prenom}}, {{meuble}}, {{boutique}}, {{signature}}…
 * Zones à remplir à la main : [à compléter : …]
 * Le gras Markdown du document source est retiré (copie en texte brut).
 */

export const EMAIL_TEMPLATE_KEYS = [
  "info_request",
  "refusal_out_of_selection",
  "refusal_bad_condition",
  "refusal_authenticity",
  "refusal_bad_timing",
  "offer",
  "pickup_confirmation",
  "non_conform",
  "received_ok",
  "sold_consignment",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplate = {
  /** Nom affiché dans l'historique : « Mail “Refus – état” préparé par… ». */
  name: string;
  subject: string;
  body: string;
  optional?: boolean;
};

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplate> = {
  info_request: {
    name: "Demande d'informations",
    subject: "Votre {{meuble}} : une petite précision pour avancer",
    body: `Bonjour {{prenom}},

Merci d'avoir confié votre {{meuble}} à {{boutique}}, et merci pour le soin apporté à votre demande.

Pour poursuivre l'étude de votre pièce, il nous manque quelques éléments :

[à compléter : ce dont vous avez besoin — photos supplémentaires, dimensions, certificat, précisions sur l'état, etc.]

Vous pouvez répondre directement à ce message, avec des photos en pièce jointe si besoin. Dès réception, nous revenons vers vous rapidement.

Belle journée,
{{signature}}`,
  },

  refusal_out_of_selection: {
    name: "Refus – hors sélection",
    subject: "Votre {{meuble}} : merci pour votre proposition",
    body: `Bonjour {{prenom}},

Merci d'avoir pensé à {{boutique}} pour votre {{meuble}}, et d'avoir pris le temps de remplir notre formulaire.

Nous avons étudié votre demande avec attention. Malheureusement, cette pièce ne correspond pas à la sélection que nous construisons aujourd'hui, et nous préférons vous le dire franchement plutôt que de vous faire attendre.

Cela ne remet évidemment pas en cause la qualité de votre meuble. Si vous avez d'autres pièces de design ou de mobilier signé, nous serons ravis d'y jeter un œil.

Belle journée à vous,
{{signature}}`,
  },

  refusal_bad_condition: {
    name: "Refus – état",
    subject: "Votre {{meuble}} : notre retour",
    body: `Bonjour {{prenom}},

Merci de nous avoir proposé votre {{meuble}}. Nous l'avons regardé avec beaucoup d'attention.

À la vue des photos, l'état de la pièce demanderait une remise en état trop importante pour que nous puissions la reprendre dans des conditions satisfaisantes, que ce soit en rachat ou en dépôt-vente. Nous préférons être transparents plutôt que de vous faire une proposition qui ne serait pas juste pour vous.

Si vous le faites restaurer par un artisan, n'hésitez pas à nous recontacter : nous réétudierons volontiers votre demande avec de nouvelles photos.

Merci encore de votre confiance, et belle journée,
{{signature}}`,
  },

  refusal_authenticity: {
    name: "Refus – authenticité",
    subject: "Votre {{meuble}} : nous ne pouvons pas donner suite pour le moment",
    body: `Bonjour {{prenom}},

Merci pour votre demande concernant votre {{meuble}}.

Nous ne reprenons que des pièces dont l'authenticité est clairement établie. À ce stade, les éléments transmis ne nous permettent pas de la confirmer, et nous ne pouvons donc pas donner suite.

Si vous disposez d'éléments supplémentaires (certificat, facture d'achat, photos de la signature, de l'étiquette ou des marquages), vous pouvez nous les envoyer : nous réexaminerons votre demande avec plaisir.

Bien cordialement,
{{signature}}`,
  },

  refusal_bad_timing: {
    name: "Refus – pas le bon moment",
    subject: "Votre {{meuble}} : merci, mais pas pour le moment",
    body: `Bonjour {{prenom}},

Merci d'avoir pensé à nous pour votre {{meuble}}. Votre demande est arrivée avec de jolis atouts.

Pour autant, nous avons déjà plusieurs pièces proches en stock, et nous ne souhaitons pas allonger inutilement le temps de vente de votre meuble. Nous préférons donc décliner pour le moment.

N'hésitez pas à nous recontacter dans quelques mois, ou pour d'autres pièces : nous serons toujours heureux d'en découvrir de nouvelles.

Belle journée,
{{signature}}`,
  },

  offer: {
    name: "Proposition",
    subject: "Votre {{meuble}} : nos deux propositions",
    body: `Bonjour {{prenom}},

Bonne nouvelle : votre {{meuble}} nous plaît et nous serions ravis de lui offrir une seconde vie. Nous vous proposons deux formules, à vous de choisir celle qui vous convient le mieux.

Option 1 — Rachat direct
Nous vous rachetons votre meuble pour {{prix_rachat}} € TTC. Vous êtes réglé après réception et validation de la conformité de la pièce. [à compléter : modalités de règlement]

Option 2 — Dépôt-vente
Nous mettons votre meuble en vente au prix de {{prix_vente_espere}} € TTC. Vous êtes réglé après la vente, déduction faite de notre commission et du temps de remise en état éventuel.
[à compléter : conditions du dépôt-vente — commission, durée du mandat, refacturation du temps]

Enlèvement
Nous organisons l'enlèvement de votre meuble avec notre transporteur. Son coût, {{prix_transport}} € TTC, est à votre charge. [à compléter : précisez s'il est déduit du règlement]

Cette proposition est valable {{validite}} jours. Pour l'accepter, répondez simplement à ce message en m'indiquant la formule choisie. Nous convenons ensuite ensemble d'un créneau d'enlèvement (matin ou après-midi), par téléphone.

N'hésitez pas à me poser toutes vos questions.

Belle journée,
{{signature}}`,
  },

  pickup_confirmation: {
    name: "Confirmation de prise en charge",
    subject: "Enlèvement de votre {{meuble}} confirmé — {{date_enlevement}}",
    body: `Bonjour {{prenom}},

Merci pour votre confiance, c'est tout bon : l'enlèvement de votre {{meuble}} est confirmé.

Date : {{date_enlevement}}, {{creneau}}
Adresse : {{adresse_vendeur}}
Formule choisie : {{mode}}

Le transporteur se présentera sur le créneau convenu. Pour que tout se passe bien, merci de :
- prévoir un accès dégagé (étage et ascenseur selon les informations que vous nous avez données : {{acces}}) ;
- laisser le meuble prêt à être récupéré, si possible protégé ;
- rester joignable au {{telephone}} le jour de l'enlèvement.

À la réception, nous contrôlons la pièce puis nous vous tenons informé(e) de la suite.

Belle journée,
{{signature}}`,
  },

  non_conform: {
    name: "Non conforme",
    subject: "Votre {{meuble}} : écart constaté à la réception",
    body: `Bonjour {{prenom}},

Votre {{meuble}} nous est bien parvenu. Après contrôle, nous constatons un écart avec la description et les photos initiales :

{{constat}}

Nous ne pouvons donc pas le conserver dans les conditions convenues. Voici ce que nous vous proposons :
- venir le récupérer à notre atelier : {{adresse_atelier}} ;
- ou le faire retourner chez vous par le transporteur (devis : {{prix_retour}} € TTC).

Dans les deux cas, les frais de récupération ou de retour sont à votre charge. Vous disposez de {{delai}} jours à compter de ce message, soit jusqu'au {{date_limite}}, pour nous indiquer votre choix. Passé ce délai, sans nouvelle de votre part, le meuble sera considéré comme abandonné et nous pourrons en disposer librement. [à valider avec le contrat]

Je reste à votre disposition pour en parler par téléphone si vous le souhaitez.

Bien cordialement,
{{signature}}`,
  },

  received_ok: {
    name: "Réception conforme",
    optional: true,
    subject: "Bien reçu : votre {{meuble}} est arrivé",
    body: `Bonjour {{prenom}},

Bonne nouvelle : votre {{meuble}} est bien arrivé chez nous et il est conforme à sa description.

Prochaines étapes : nettoyage, éventuels petits travaux de remise en état, shooting photo, puis mise en ligne. Nous vous tiendrons informé(e) dès qu'il sera en vente.

[à compléter : si rachat direct, modalités et délai de règlement ; si dépôt-vente, prix de mise en vente rappelé]

Merci encore de votre confiance,
{{signature}}`,
  },

  sold_consignment: {
    name: "Meuble vendu (dépôt-vente)",
    optional: true,
    subject: "Votre {{meuble}} a trouvé preneur",
    body: `Bonjour {{prenom}},

Une très bonne nouvelle : votre {{meuble}} vient d'être vendu au prix de {{prix_vente}} € TTC.

Voici le détail du règlement :
[à compléter : prix de vente, commission, temps de remise en état, montant à vous reverser, date et mode de règlement]

Merci de nous avoir confié cette pièce, nous espérons avoir l'occasion de travailler à nouveau ensemble.

Belle journée,
{{signature}}`,
  },
};

/** Libellé affiché quand une variable n'a pas de valeur : « [à compléter : prix de rachat] ». */
export const VARIABLE_LABELS: Record<string, string> = {
  prenom: "prénom",
  meuble: "meuble",
  boutique: "nom de la boutique",
  signature: "signature",
  validite: "durée de validité",
  prix_rachat: "prix de rachat",
  prix_vente_espere: "prix de vente espéré",
  prix_transport: "coût du transport",
  date_enlevement: "date d'enlèvement",
  creneau: "créneau",
  adresse_vendeur: "adresse",
  mode: "formule choisie",
  acces: "étage / ascenseur",
  telephone: "téléphone",
  constat: "constat",
  adresse_atelier: "adresse de l'atelier",
  prix_retour: "devis retour",
  delai: "délai",
  date_limite: "date limite",
  prix_vente: "prix de vente",
};
