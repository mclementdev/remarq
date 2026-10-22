# Cahier des charges V1 — Outil interne Remarq
*Réception, suivi et mise en ligne de mobilier d'occasion haut de gamme — version 1.0 du 21/10/2026*

> Document destiné à Claude Code. Tout ce qui est écrit ici est **décidé**, sauf les points marqués **À CONFIRMER** (une valeur par défaut est donnée : ne pas bloquer le développement dessus).
> Les modèles d'e-mails sont dans `EMAILS_MODELES.md`.

---

## 1. Contexte et objectif

Martin gère une activité d'achat/revente et de dépôt-vente de mobilier de design d'occasion (modèle proche de rehaus.co). Le site vitrine actuel est une boutique **Shopify** (mobilistore.fr, logo « Remarq »). Cet outil **n'est pas** le site : c'est un outil interne, hébergé sur un **sous-domaine** du site actuel, avec **aucune connexion** à Shopify, Leboncoin, au transporteur ni à un service d'e-mail.

Objectifs :
1. Recevoir proprement les demandes de vente via un **formulaire public** (lien depuis le site Shopify).
2. Piloter chaque meuble de la demande jusqu'à la vente dans un **CRM type Trello**.
3. Garder l'historique complet, les temps passés, les frais et calculer la **marge** par meuble.
4. **Générer par IA** les textes de mise en ligne (site + Leboncoin) à copier/coller.
5. **Pré-rédiger tous les e-mails** à copier/coller (pas d'envoi depuis l'outil).

Utilisateurs : 2 personnes (Martin + un salarié), mêmes droits, pas de rôles.

## 2. Hors périmètre (ne pas développer)

- Envoi automatique d'e-mails (aucun SMTP, aucun Resend, etc.)
- Connexion API Shopify, Leboncoin, transporteur
- RGPD / CGU / bandeau cookies / anti-spam
- Rôles et permissions, comptes clients, suivi de dossier côté client, fiche client multi-meubles
- Gestion des litiges, export CSV, retouche photo, reprise de données existantes
- Formule automatique de prix de rachat, contrat de dépôt-vente (fournis plus tard)
- Anglais ou autre langue : **interface 100 % française**

## 3. Stack technique

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**, déployé sur **Vercel** (sous-domaine, ex. `outil.mobilistore.fr`)
- **Supabase** : Auth (e-mail + mot de passe), Postgres, Storage (photos)
- **IA** : API Anthropic côté serveur uniquement (`ANTHROPIC_API_KEY` en variable d'environnement Vercel). Le nom du modèle est une variable d'environnement (`ANTHROPIC_MODEL`) ; vérifier la documentation actuelle pour choisir un modèle récent.
- Drag-and-drop du Kanban : bibliothèque maintenue (ex. dnd-kit). ZIP des photos : JSZip ou équivalent.
- Aucun compte public : les 2 comptes sont créés à la main dans Supabase ; l'inscription est désactivée.
- Fournir : migrations SQL versionnées, `.env.example`, `README.md` (déploiement Vercel + Supabase, création des comptes, ajout du sous-domaine DNS côté Shopify/registrar).

## 4. Écrans (7)

| # | Écran | URL | Accès |
|---|-------|-----|-------|
| 1 | Formulaire de dépôt | `/depot` | Public |
| 1b | Page de confirmation | `/depot/merci` | Public |
| 2 | Connexion | `/connexion` | Public |
| 3 | Dashboard | `/` | Connecté |
| 4 | CRM (Kanban) | `/crm` | Connecté |
| 5 | Fiche meuble | `/meubles/[id]` | Connecté |
| 6 | Tous les meubles (suivi depuis la création) | `/meubles` | Connecté |
| 7 | Réglages (marques, paramètres) | `/reglages` | Connecté |

Navigation back-office : Dashboard · CRM · Tous les meubles · Réglages · Déconnexion.
Le formulaire public doit être **parfait sur mobile** (les vendeurs photographient avec leur téléphone). Le back-office est pensé desktop d'abord, utilisable sur tablette.

## 5. Écran 1 — Formulaire de dépôt (public)

Sections, dans cet ordre :

**A. Le meuble**
- Photos (voir règles ci-dessous)
- Nom / modèle du meuble — *obligatoire*
- Catégorie — *obligatoire* : Assises · Rangements · Tables & Bureaux · Luminaires & Décoration
- Marque — *obligatoire* : liste déroulante alimentée par la table `brands` + choix « Autre » qui ouvre un champ libre
- Designer — optionnel
- Année approximative de fabrication — optionnel
- Description rapide — *obligatoire* (texte libre)
- Dimensions L × P × H en cm — optionnel
- Matières / couleur — optionnel
- État — *obligatoire* : Neuf · Très bon état · Bon état · État d'usage · À restaurer
- Défauts éventuels (précisions) — optionnel
- Année d'achat — optionnel
- Prix payé à l'origine — optionnel
- Prix souhaité — optionnel *(les deux champs prix sont optionnels : le vendeur n'impose rien, c'est Martin qui fait ensuite 2 propositions)*
- Photo du certificat d'authenticité — optionnel (1 à 3 images, **ne compte pas** dans le max de 10 photos)

**B. Enlèvement**
- Étage (rez-de-chaussée, 1, 2, 3, 4 et +), ascenseur (oui/non), accès difficile ou précisions (texte libre)

**C. Vos coordonnées** — tous *obligatoires*
- Prénom, Nom, E-mail, Téléphone, Adresse (rue, code postal, ville)

**D. Certification** — case *obligatoire* :
« Je certifie que ce meuble est authentique et que je suis bien le propriétaire de cet objet. » (horodatage et texte exact enregistrés)

**Règles photos**
- Emplacements guidés avec libellés : **Face · Dos · Profil · Détail (signature/étiquette) · Défaut**, puis ajout libre (« Ajouter une photo »).
- Minimum **3**, maximum **10** (hors certificat). Bloquer l'envoi sinon, avec un message clair.
- Compression/redimensionnement côté navigateur (≈ 2000 px max, JPEG qualité ~0,85) avant envoi ; barre de progression ; réessai en cas d'échec.
- Les uploads passent par des URL signées générées côté serveur (le bucket est privé).

**Après envoi** : redirection vers `/depot/merci` (« Merci, nous avons bien reçu votre demande, nous revenons vers vous rapidement. »). **Aucun e-mail automatique.**
Créer le meuble au statut **Nouvelle demande**.

## 6. Statuts et workflow

Clés techniques en anglais, libellés en français.

| Clé | Libellé | Colonne Kanban |
|-----|---------|----------------|
| `new` | Nouvelle demande | oui |
| `info_requested` | Infos demandées | oui |
| `accepted` | Accepté — proposition à envoyer | oui |
| `offer_sent` | Proposition envoyée | oui |
| `offer_accepted` | Proposition acceptée — enlèvement à planifier | oui |
| `pickup_scheduled` | Enlèvement planifié | oui |
| `in_transit` | En transit | oui |
| `received` | Réceptionné — à contrôler | oui |
| `non_conform` | Non conforme | oui |
| `preparing` | En préparation (mise en ligne) | oui |
| `online` | En ligne | oui |
| `sold` | Vendu — retrait acheteur à organiser | oui |
| `done` | **Nouvelle vie** (clôturé : retiré par l'acheteur) | archives |
| `refused` | Refusé | archives |
| `offer_declined` | Proposition déclinée par le client | archives |
| `returned` | Restitué au client | archives |

*(« Nouvelle vie » remplace « Clôturé ». **À CONFIRMER** : si Martin préfère un autre nom, c'est un simple libellé à changer en un endroit.)*

**Kanban** : 12 colonnes principales de gauche à droite. Les 4 statuts d'archives sont regroupés dans une zone repliable « Archives » à droite du tableau (avec compteurs). Tout reste retrouvable dans l'écran `/meubles`.

**Règles de transition** : le déplacement entre colonnes est libre (retour arrière possible pour corriger une erreur) et **toujours journalisé**. Certaines transitions ouvrent une fenêtre qui demande l'information nécessaire :

| Vers | Information demandée |
|------|----------------------|
| `info_requested` | (rien ; propose le mail générique) |
| `refused` | Motif (liste) → propose le modèle d'e-mail de refus correspondant |
| `accepted` | (rien) |
| `offer_sent` | Prix de rachat proposé, prix de vente espéré, conditions dépôt-vente (texte libre), coût de transport (tarif saisi à la main) → propose le mail « Proposition » |
| `offer_declined` | (rien) |
| `offer_accepted` | **Mode choisi par le client** : Rachat direct ou Dépôt-vente ; prix de rachat final si rachat |
| `pickup_scheduled` | Date + créneau (Matin / Après-midi) → propose le mail « Confirmation de prise en charge » |
| `received` | Date de réception |
| `non_conform` | Constat (texte) + photos de conformité + choix du client : vient le chercher / retour par transporteur ; **démarre le compteur de 15 jours** → propose le mail « Non conforme » |
| `preparing` | (rien) — depuis `received` après contrôle conforme, ou depuis `non_conform` si le délai de 15 jours est dépassé (le meuble est alors conservé : tag « Abandonné par le client », prix d'achat 0 € par défaut, modifiable) |
| `online` | Prix affiché, publié sur le site (case + date), publié sur Leboncoin (case + date) |
| `sold` | **Prix de vente final TTC**, canal de vente (Site / Leboncoin / Autre), date de vente |
| `done` | Date de retrait par l'acheteur |
| `returned` | Date de restitution |

**Ancienneté** : sur chaque carte Kanban, afficher « depuis X jours » dans la colonne actuelle (aucune couleur d'alerte). Dans la fiche, la **frise historique** liste chaque changement de statut avec date/heure et auteur, plus la durée passée dans chaque statut.
Sur les cartes `non_conform`, afficher « J+X / 15 » à la place.

**Carte Kanban** : vignette de la 1re photo, nom, marque, badge **Rachat / Dépôt-vente** (une fois connu), prix de vente espéré s'il existe, « depuis X jours ».
Barre de recherche + filtres (marque, catégorie, mode) au-dessus du Kanban.

## 7. Écran 5 — Fiche meuble

Page unique, avec un en-tête fixe (nom, marque, statut actuel, ancienneté, boutons d'action) et des sections :

1. **Informations du meuble** — toutes les données du formulaire, **modifiables**, galerie des photos (clic pour agrandir, ajout/suppression, ordre modifiable, photo principale).
2. **Vendeur** — prénom, nom, e-mail, téléphone, adresse complète, accessibilité (étage, ascenseur, précisions) ; boutons « Copier l'adresse », « Copier l'e-mail », lien `tel:`.
3. **Décision / Actions** — selon le statut : boutons **Refuser**, **Demander des infos**, **Accepter**, puis les actions suivantes du workflow. Chaque action ouvre le mail pré-rédigé correspondant (voir §9).
4. **Finances** — voir §8.
5. **Temps passé** — voir §8.
6. **Calendrier** — rendez-vous (enlèvement chez le vendeur, retrait acheteur, retour au client) : date + **Matin / Après-midi** + note. Saisis à la main par Martin après son appel avec le client. Pas de lien envoyé au client.
7. **Mise en ligne** — textes générés (voir §10), photos de mise en ligne, **bouton « Télécharger les photos (ZIP) »**, cases « Publié sur le site / Leboncoin » avec dates.
8. **Conformité** — constat, photos de conformité (ajout possible à tout moment), décision.
9. **Notes internes** — fil de notes horodatées et signées + pièces jointes (factures, certificats, PDF, images).
10. **Historique** — frise complète (statuts, e-mails préparés, modifications importantes, notes, rendez-vous).

## 8. Finances, temps passé et marge

Tous les montants sont en **euros TTC**. Pas de calcul de TVA.

**Champs de base du meuble** : prix payé à l'origine (info vendeur), prix souhaité par le vendeur (info), prix de rachat proposé, prix de vente espéré (saisi par Martin), coût de transport d'enlèvement (saisi à la main, à la charge du vendeur : conservé pour mémoire, **n'entre pas dans la marge** sauf ligne d'ajustement), prix de rachat final (si rachat), commission dépôt-vente (montant saisi, avec affichage du % équivalent), prix de vente final.

**Lignes d'ajustement** : liste libre, positives ou négatives, ajoutables à tout moment (libellé, montant signé, catégorie : frais annexe / ajustement / autre, date). Exemples : produit de nettoyage, pièce de réparation, frais de plateforme, remise commerciale…

**Temps passé** : saisie d'heures **incrémentales** par type : **Nettoyage · Réparation · Photos · Autre**. Interface : boutons rapides « +0,25 h / +0,5 h / +1 h » par type et saisie libre (pas de 0,25 h), date et note optionnelle. Total par type et total général affichés.

**Taux horaire** : paramètre global dans Réglages (`hourly_rate`). **À CONFIRMER** : valeur par défaut **0 €** (tant qu'il vaut 0, le coût du temps n'est pas valorisé). Martin le fixera.

**Affichage de marge** (informatif : Martin prend les décisions, aucune règle automatique) :
- **Rachat direct** : marge brute = prix de vente final − prix de rachat final + Σ lignes d'ajustement ; **marge nette** = marge brute − (heures totales × taux horaire).
- **Dépôt-vente** : recette = commission saisie + (heures totales × taux horaire, affiché comme « temps refacturable ») + Σ lignes d'ajustement ; affichage informatif « Montant à reverser au déposant » = prix de vente final − commission − temps refacturable.
- Afficher le détail du calcul ligne par ligne dans la fiche (jamais un chiffre sans explication).

## 9. E-mails à copier/coller

Voir `EMAILS_MODELES.md` (10 modèles, dont 4 de refus et 2 optionnels). Comportement :
- Les modèles sont des fichiers dans le code, avec des **variables** `{{prenom}}`, `{{meuble}}`, `{{boutique}}`… remplacées par les données de la fiche.
- Une fenêtre affiche l'objet et le corps **modifiables** avant copie, avec les boutons **Copier l'objet**, **Copier le corps**, **Copier tout**, et un lien `mailto:` facultatif (ouvre le client mail de Martin, pas d'envoi par l'outil).
- Les champs `[à compléter : …]` sont mis en évidence tant qu'ils n'ont pas été remplis.
- Chaque ouverture/copie est notée dans l'historique : « Mail “Refus – état” préparé par Prénom ».
- Les variables globales (nom de la boutique, signature, adresse de l'atelier, délai de validité des propositions) sont éditables dans Réglages.

## 10. Génération IA des textes de mise en ligne

Bouton « Générer les textes » dans la section Mise en ligne de la fiche. Entrées : toutes les données disponibles (marque, designer, année, dimensions, matières, état, défauts, description du vendeur, notes internes, travaux effectués, prix affiché).

**Sortie 1 — Annonce site (style Mobilistore/Remarq)** :
- **Titre** selon le modèle du site : `Type de meuble, nom du modèle, matière/couleur, par Fabricant, design pays, années XXXX` (ex. « Fauteuil Safari cuir blanc par Ibisco, design italien, années 1970 »).
- Paragraphe de présentation court, sobre, rythmé (2 à 4 phrases), sans superlatifs creux.
- Caractéristiques : marque, designer, année/époque, dimensions, matières, **état détaillé** (honnête, précis) et travaux de remise en état réalisés.
- Aucune invention : si une information manque, ne pas l'inventer (la laisser de côté ou la signaler « à compléter »).

**Sortie 2 — Annonce Leboncoin** :
- Titre ≤ 70 caractères, description structurée (état, dimensions, marque, authenticité, mention « livraison par transporteur, frais à la charge de l'acheteur »), catégorie suggérée, prix, mots-clés.

Chaque texte est **éditable**, **régénérable** (avec une consigne optionnelle : « plus court », « insiste sur… »), **sauvegardé** dans la fiche et doté d'un bouton **Copier**. Prévoir une gestion propre des erreurs de l'API et un état de chargement.

## 11. Écran 3 — Dashboard

Sélecteur de mois (par défaut : mois en cours). Les chiffres reposent sur la **date de vente**.

- **Indicateurs du mois** : nombre de meubles vendus, **chiffre d'affaires TTC** (Σ prix de vente final), **marge totale**, marge moyenne par meuble ; chacun avec l'écart par rapport au mois précédent (valeur et %).
- **Graphique mois/mois** sur 12 mois : CA et marge.
- Répartition rachat / dépôt-vente du mois.
- Nombre de meubles **par statut** (liens vers le CRM filtré).
- Délai moyen entre réception et vente ; taux d'acceptation (demandes acceptées / demandes tranchées) ; **stock immobilisé** (Σ prix de rachat des meubles rachetés non vendus + nombre de dépôts-ventes en stock).
- **Agenda des 14 prochains jours** : enlèvements et retraits prévus (date, matin/après-midi, meuble, adresse).
- Alerte discrète : nombre de nouvelles demandes non traitées.

Une marge de rachat utilise la marge nette si le taux horaire > 0, sinon la marge brute. Pour la marge d'un dépôt-vente, utiliser la recette définie en §8.

## 12. Écran 6 — Tous les meubles

Tableau complet de **tous** les meubles depuis le début (y compris refusés, non conformes, vendus depuis longtemps, restitués).
- Colonnes : vignette, nom, marque, catégorie, mode, statut, ancienneté dans le statut, date de création, date de vente, prix de vente, marge.
- Recherche texte (nom, marque, nom/prénom du vendeur), filtres (statut, marque, catégorie, mode, période de création, vendu / non vendu), tris, pagination.
- Clic = fiche meuble.

## 13. Écran 7 — Réglages

- **Marques** : liste, ajout, renommage, suppression/désactivation. Les marques saisies via « Autre » dans le formulaire apparaissent comme **suggestions à valider** (« Ajouter à la liste ») dans cet écran.
- **Paramètres** : nom de la boutique, signature des e-mails, adresse de l'atelier (retrait des non conformes), délai de validité des propositions (défaut 7 jours), taux horaire (défaut 0 €), délai non conformité (défaut 15 jours).
- **Marques de départ** (à pré-charger) : Cassina, Vitra, Knoll, Roche Bobois, Ligne Roset, Herman Miller, Fritz Hansen, B&B Italia, Poltrona Frau, Artek, Acerbis, Ibisco, Serenissimo, Thonet, Molteni & C, Minotti, Flexform, Cappellini, Zanotta, Artemide, Flos, Tecno, Kartell, Hay.

## 14. Modèle de données (indicatif, à affiner par Claude Code)

- `furnitures` : identité du meuble, champs du formulaire, coordonnées du vendeur (intégrées, **pas de table clients**), `status`, `status_changed_at`, `mode` (buyout | consignment | null), champs financiers du §8, conditions dépôt-vente, constat de conformité, `non_conform_resolution`, dates clés, textes générés, flags de publication, `certified_at` + texte de certification.
- `status_history` : meuble, de/vers, date, auteur, données associées.
- `photos` : meuble, type (depot | certificat | conformite | mise_en_ligne), libellé (face, dos, profil, détail, défaut, autre), position, chemin de stockage.
- `time_entries` : meuble, type (nettoyage | reparation | photos | autre), heures, date, note, auteur.
- `finance_lines` : meuble, libellé, montant signé, catégorie, date.
- `appointments` : meuble, type (enlevement_vendeur | retrait_acheteur | retour_client), date, période (matin | apres_midi), note, effectué.
- `notes` / `attachments` : fil de notes et pièces jointes.
- `brands` : nom, actif ; `brand_suggestions` : texte saisi via « Autre ».
- `settings` : clé/valeur.

**Sécurité** : RLS activé partout. Le formulaire public n'écrit que via une route serveur contrôlée (validation Zod côté serveur, URLs d'upload signées). Le back-office est protégé par middleware d'authentification ; photos servies par URL signées temporaires. Clés secrètes jamais exposées au navigateur.

## 15. Design

Reprendre l'identité de **mobilistore.fr** : épuré, mise en valeur des photos, boutons en **majuscules**, ton sobre. La page n'étant pas récupérable ici sans ses feuilles de style, **Claude Code doit** : récupérer le HTML/CSS du site (curl ou navigateur), extraire polices, palette, rayons, espacements, styles de boutons, les mettre en variables Tailwind, et **demander une capture d'écran à Martin** si l'extraction ne suffit pas.
Le back-office doit rester lisible et sobre (tableaux denses, cartes Kanban compactes), le formulaire plus aéré et rassurant. Accessibilité de base (contrastes, focus, labels).

## 16. Ordre de réalisation conseillé

1. Mise en place : projet Next.js, Supabase (schéma + RLS + seed marques), authentification, thème Mobilistore.
2. Formulaire public + upload photos + page de confirmation.
3. Liste « Tous les meubles » + fiche meuble (informations, vendeur, historique).
4. Kanban + transitions avec fenêtres de saisie + frise d'ancienneté.
5. E-mails pré-rédigés (10 modèles) + notes + calendrier.
6. Finances, temps passé, marge.
7. Mise en ligne : génération IA, ZIP des photos.
8. Dashboard.
9. Réglages, tests, finitions, README de déploiement.

## 17. Critères d'acceptation V1

- Un vendeur peut déposer un meuble depuis son téléphone (3–10 photos), et le meuble apparaît en « Nouvelle demande ».
- Martin et le salarié se connectent, déplacent un meuble de bout en bout (de Nouvelle demande à Nouvelle vie) avec les saisies demandées, et chaque changement est visible dans l'historique avec date et auteur.
- Chaque mail se génère, se modifie et se copie correctement, avec ses variables remplies.
- Le compteur de 15 jours pour les non-conformes est fiable.
- La marge d'un meuble en rachat et d'un meuble en dépôt-vente s'affiche avec son détail ; le dashboard totalise correctement par mois.
- Les textes IA se génèrent, se modifient, se copient ; le ZIP des photos fonctionne.
- Tous les meubles, même anciens ou refusés, sont retrouvables dans `/meubles`.

## 18. Informations à fournir ultérieurement (hors V1)

Contrat de dépôt-vente · formule du prix de rachat · barème/tarifs de transport · nom du transporteur · taux horaire · éventuellement capture/CSS du site si l'extraction automatique est insuffisante.
