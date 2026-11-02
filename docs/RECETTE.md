# Recette avant la mise en ligne (salon Époqu'Auto, 6–8 novembre)

À faire sur **l'adresse de production**, avec un **iPhone** et un **Android**, en **4G** (Wi-Fi coupé) pour les étapes marquées 📶.
Cochez au fur et à mesure ; notez tout écart avec une capture d'écran.

## A. QR codes et liens courts
- [ ] Les redirections Shopify `remarq.fr/d/stand`, `/d/carte`, `/d/flyer`, `/d/ig`, `/d/carjager` existent (DEPLOIEMENT §5).
- [ ] 📶 Scanner chaque QR (*Réglages → QR codes*, ou le fichier imprimé) avec l'appareil photo : la page `/salon` s'ouvre.
- [ ] Les QR imprimés (épreuve) font au moins 2 × 2 cm et gardent leur marge blanche ; ils se scannent à 30 cm.

## B. Landing `/salon`
- [ ] Arrivée par `/d/carte` : le premier bouton est « Recevez le lien pour plus tard » et le bloc e-mail est juste sous l'accroche.
- [ ] Arrivée par `/d/ig` : le premier bouton est « Remplir le formulaire maintenant » ; le bloc e-mail est sous le formulaire.
- [ ] Même page que `/depot` (accroche, formulaire, comment ça marche, avis, ce que nous prenons, FAQ, pied de page) ; pas de menu en haut.
- [ ] « Obtenir mon estimation gratuite » (bandeau noir) remonte au formulaire.
- [ ] Textes relus et validés dans `lib/content/vendre.ts` et `lib/content/salon.ts` (plus aucun bloc « PROVISOIRE », réponses de la FAQ comprises).
- [ ] Liens du pied de page : chacun ouvre la bonne page de remarq.fr.
- [ ] Polices Instrument Serif (titres) et Instrument Sans, boutons orange arrondis ; rien ne déborde à l'écran.
- [ ] Partage du lien dans WhatsApp ou iMessage : l'aperçu montre le titre et l'image Remarq.

## C. Lien par e-mail
- [ ] Sans cocher le consentement : message « Merci d'accepter… », rien n'est envoyé.
- [ ] Avec une adresse mal tapée : message « Adresse e-mail invalide ».
- [ ] 📶 Envoi : écran « C'est envoyé ! » ; e-mail reçu en moins d'une minute, pas dans les indésirables, lien du formulaire fonctionnel.
- [ ] Gmail → *Afficher l'original* : SPF PASS, DKIM PASS.
- [ ] *Supabase → salon_leads* : la ligne contient l'e-mail, la source et `email_sent_at`.

## D. Formulaire de reprise (3 étapes, plusieurs pièces)
- [ ] Sur `/salon`, « Remplir le formulaire maintenant » descend jusqu'au formulaire ; `/depot` fonctionne aussi directement (présentation à gauche sur ordinateur, sous le formulaire sur téléphone ; ni barème, ni « Année d'achat » / « Prix payé »).
- [ ] Étape 1 · Vos pièces : sans type de pièce ou avec moins de 3 photos, « Continuer » est bloqué avec un message sous le champ.
- [ ] 📶 Une pièce avec **3 photos** prises avec l'appareil photo : barres de progression, « ✓ Envoyée » sur chaque vignette.
- [ ] 📶 « Ajouter une autre pièce » : deuxième pièce avec **10 photos** (sélection multiple dans la galerie) ; envoi en moins de 2 minutes ; la zone d'ajout disparaît à 10.
- [ ] Le curseur « Note d'état » affiche le bon libellé (0–3 Usé, 4–6 Bon, 7–8 Très bon, 9–10 Comme neuf).
- [ ] Brouillon : recharger la page → retour à l'étape 1 avec les textes conservés (les photos sont à rajouter).
- [ ] Étape 2 · Enlèvement : adresse et case de certification obligatoires.
- [ ] Étape 3 · Vos coordonnées : prénom, e-mail et téléphone obligatoires ; nom facultatif ; un numéro trop court est refusé ; l'indicatif se change (+32, +41…). « Envoyer ma demande » → page Merci (« … pour 2 pièces »).
- [ ] *Réglages → Barème de partage* : modifier un pourcentage, l'enregistrer, le voir sur `/depot`, puis le remettre.

## E. Outil (bureau)
- [ ] Connexion avec votre compte puis celui de François.
- [ ] Les demandes de D apparaissent dans *CRM* en « Nouvelle demande », avec leurs photos : une carte par pièce, pastille « 1/2 », « ×2 » pour une quantité de 2.
- [ ] Fiche d'une pièce : type, modèle, quantité, note du vendeur, source (QR), consentement, et liens vers les autres pièces de la demande. Modifier le téléphone du vendeur le change sur les autres pièces.
- [ ] Déplacer une carte : fenêtre de saisie, puis historique avec date et prénom.
- [ ] Fiche → *Télécharger les photos (ZIP)*.
- [ ] Charte appliquée sur le dashboard, le Kanban et une fiche.

## F. Sécurité et nettoyage
- [ ] `https://<adresse>/crm` dans une fenêtre privée renvoie vers la connexion.
- [ ] *Supabase → Authentication → Users* : uniquement vos deux comptes.
- [ ] Après la recette : supprimer les demandes et leads de test (*Table Editor* : `furnitures`, `salon_leads`).
- [ ] Une première sauvegarde (`supabase db dump`, DEPLOIEMENT §1.8) est faite avant le salon.
