/**
 * Textes de la page « Vendre » (/depot et /salon), repris de la maquette de remarq.fr.
 * Le formulaire a ses propres textes (lib/content/depot.ts), le bloc « lien » aussi (lib/content/salon.ts).
 *
 * ⚠️ Les réponses de la FAQ sont PROVISOIRES (rédigées par Claude Code) : à remplacer par celles de Remarq.
 */

export const vendreContent = {
  hero: {
    title: "Vendez votre mobilier design sans effort.",
    text: "On s'occupe de tout : estimation de vos pièces, collecte à domicile, remise en valeur, stockage et vente. Vous n'avez rien à gérer, vous êtes payé à la vente.",
    checks: ["Estimation gratuite sous 48 h", "Collecte à domicile", "Paiement sous 14 jours"],
  },

  /** Boutons de /salon (ancres vers le bloc lien et le formulaire). */
  salonButtons: { link: "Recevez le lien pour plus tard", now: "Remplir le formulaire maintenant" },

  howItWorks: {
    eyebrow: "Comment ça marche",
    title: "Vendez vite et bien, la complexité en moins.",
    steps: [
      { title: "Estimation & signature", text: "Nous fixons ensemble un prix de vente et un prix plancher, puis signons un mandat de vente." },
      { title: "Retrait à domicile", text: "Nous venons récupérer vos pièces à domicile, sur le créneau de votre choix." },
      { title: "Mise en valeur & diffusion", text: "Nettoyage, petites réparations, photos pro, annonces optimisées, diffusion auprès d'acheteurs qualifiés sur plusieurs canaux." },
      { title: "Vente & paiement", text: "Une fois la pièce vendue et livrée, vous recevez votre paiement sous 15 jours." },
    ],
    cta: "Obtenir mon estimation gratuite",
  },

  testimonials: {
    eyebrow: "Ils nous font confiance",
    title: "Une passion qui se voit.",
    items: [
      {
        text: "Great seller, amazing taste and research. Very fair prices and priceless care in the customer guidance and arranging for shipping. François is a true lover of vintage gems and his passion shows.",
        author: "UN/DONE Architectures",
        place: "Rome",
      },
      {
        text: "Expérience parfaite ! J'ai reçu mes 4 magnifiques chaises très rapidement et dans un état parfait. François a été très arrangeant et disponible, je recommande à 100 %.",
        author: "Bailey",
        place: "Paris",
      },
      {
        text: "Très belle sélection et mobilier en parfait état. Hyper satisfaits du très beau canapé. Accueil à Lyon et livraison dans le sud de la France au top !",
        author: "Justine R., Krachen",
        place: "Marseille",
      },
    ],
  },

  whatWeTake: {
    eyebrow: "Ce que nous prenons",
    title: "Du design, de toutes les époques.",
    yesTitle: "Nous recherchons",
    yes: [
      "Mobilier et luminaires de designers et de grandes maisons d'édition",
      "Pièces vintage et contemporaines, des années 50 à aujourd'hui",
      "Pièces en bon état, même avec une patine ou de petits défauts",
      "Ensembles complets : salon, salle à manger, bureau",
    ],
    brands: [
      "B&B Italia", "Cassina", "Ligne Roset", "Poltrona Frau", "Roche Bobois", "Knoll", "Vitra", "Fritz Hansen",
      "Artemide", "Flos", "Kartell", "Cinna", "de Sede", "USM", "Herman Miller", "Molteni&C", "Flexform", "Minotti",
    ],
    noTitle: "Nous ne prenons pas",
    no: [
      "Mobilier de grande distribution sans valeur de revente",
      "Literie, matelas et textiles d'ameublement seuls",
      "Électroménager et cuisines équipées",
      "Pièces endommagées structurellement ou infestées",
    ],
  },

  // PROVISOIRE : réponses à remplacer par celles de Remarq.
  faq: {
    eyebrow: "FAQ",
    title: "Vos questions, nos réponses.",
    items: [
      { q: "Combien vais-je toucher ?", a: "Un pourcentage du prix de vente final, précisé dans notre proposition avant toute signature. Plus la pièce se vend cher, plus votre part est importante. Aucun frais caché." },
      { q: "Comment fixez-vous le prix ?", a: "À partir de vos photos et informations, nous comparons avec les ventes récentes de pièces équivalentes. Nous vous proposons un prix de vente et un prix plancher, que nous fixons ensemble avant toute signature." },
      { q: "Quelles pièces acceptez-vous ?", a: "Du mobilier, des luminaires et des objets de designers ou de grandes maisons d'édition, vintage ou contemporains, en bon état. Voir « Ce que nous prenons » ci-dessus." },
      { q: "Qui s'occupe de l'enlèvement ?", a: "Nous. Nous venons chercher vos pièces à domicile, sur un créneau convenu avec vous. Indiquez l'étage, l'ascenseur et les difficultés d'accès dans le formulaire." },
      { q: "Ma pièce a quelques défauts, est-ce un problème ?", a: "Non, la patine fait partie du charme du vintage. Décrivez et photographiez les défauts : nous en tenons compte dans l'estimation et nous nous chargeons des petites réparations." },
      { q: "Où sont vendues mes pièces ?", a: "Sur remarq.fr, dans notre showroom de Villeurbanne et sur des plateformes spécialisées, auprès d'acheteurs qualifiés en France et à l'étranger." },
      { q: "Quand suis-je payé ?", a: "Une fois la pièce vendue et livrée à l'acheteur, vous recevez votre paiement sous 15 jours." },
      { q: "Et si ma pièce ne se vend pas tout de suite ?", a: "Nous la gardons en stock et continuons à la diffuser. Si besoin, nous faisons le point avec vous sur le prix, sans jamais descendre sous le prix plancher convenu." },
      { q: "Travaillez-vous avec les entreprises ?", a: "Oui : bureaux, hôtels, showrooms. Écrivez-nous à contact@remarq.fr en décrivant votre projet, nous vous répondons rapidement." },
      { q: "Puis-je apporter ma pièce au showroom ?", a: "Oui, sur rendez-vous, à notre showroom de Villeurbanne. Envoyez d'abord votre demande avec le formulaire pour que nous puissions préparer votre visite." },
    ],
  },

  closing: {
    title: "Prêt à libérer de la place (et à être payé) ?",
    text: "Estimation gratuite en ligne, ou venez nous montrer vos pièces au showroom de Villeurbanne.",
  },

  /** Pied de page : chemins sur la boutique (remarq.fr), sauf ceux qui commencent par « app: » (pages de cet outil). */
  footer: {
    columns: [
      {
        title: "Boutique",
        links: [
          { label: "Nouveautés", href: "/collections/disponible" },
          { label: "Assises", href: "/collections/assises" },
          { label: "Tables & Bureaux", href: "/collections/tables-bureaux" },
          { label: "Rangements", href: "/collections/rangements" },
          { label: "Luminaires & Décoration", href: "/collections/luminaires-decoration" },
        ],
      },
      {
        title: "Remarq",
        links: [
          { label: "L'histoire", href: "/pages/histoire" },
          { label: "Comment ça marche ?", href: "app:/depot#comment-ca-marche" },
          { label: "Les engagements", href: "/pages/engagements" },
          { label: "Vendre mes meubles", href: "app:/depot" },
          { label: "Prendre rendez-vous", href: "/pages/rendez-vous" },
          { label: "Programme partenaires", href: "/pages/partenaires" },
        ],
      },
      {
        title: "Infos pratiques",
        links: [
          { label: "Livraison", href: "/pages/livraison" },
          { label: "FAQ", href: "/pages/faq" },
          { label: "Contact", href: "/pages/contact" },
          { label: "Mentions légales", href: "/policies/legal-notice" },
          { label: "CGV", href: "/policies/terms-of-service" },
          { label: "Politique de confidentialité", href: "app:/confidentialite" },
        ],
      },
    ],
    copyright: "© 2026 Remarq",
  },
} as const;
