# Recette avant la mise en ligne (salon Époqu'Auto, 6–8 novembre)

À faire sur **l'adresse de production**, avec un **iPhone** et un **Android**, en **4G** (Wi-Fi coupé) pour les étapes marquées 📶.
Cochez au fur et à mesure ; notez tout écart avec une capture d'écran.

## A. QR codes et liens courts
- [ ] Les redirections Shopify `remarq.fr/d/stand`, `/d/carte`, `/d/flyer`, `/d/ig`, `/d/carjager` existent (DEPLOIEMENT §5).
- [ ] 📶 Scanner chaque QR (*Réglages → QR codes*, ou le fichier imprimé) avec l'appareil photo : la page `/salon` s'ouvre.
- [ ] Les QR imprimés (épreuve) font au moins 2 × 2 cm et gardent leur marge blanche ; ils se scannent à 30 cm.

## B. Landing `/salon`
- [ ] Arrivée par `/d/carte` : le premier bouton est « Recevez le lien pour plus tard ».
- [ ] Arrivée par `/d/ig` : le premier bouton est « Remplir le formulaire maintenant ».
- [ ] Textes relus et validés dans `lib/content/salon.ts` (plus aucun bloc « PROVISOIRE »).
- [ ] Police Alte Haas Grotesk, fond crème, boutons rouge brique ; rien ne déborde à l'écran.
- [ ] Partage du lien dans WhatsApp ou iMessage : l'aperçu montre le titre et l'image Remarq.

## C. Lien par e-mail
- [ ] Sans cocher le consentement : message « Merci d'accepter… », rien n'est envoyé.
- [ ] Avec une adresse mal tapée : message « Adresse e-mail invalide ».
- [ ] 📶 Envoi sans date de rappel : écran « C'est envoyé ! » ; e-mail reçu en moins d'une minute, pas dans les indésirables, lien du formulaire fonctionnel.
- [ ] 📶 Envoi avec une date de rappel : l'e-mail contient la pièce jointe `rappel-remarq.ics` (ajout dans l'agenda iPhone à la bonne heure) et le bouton « Ajouter à Google Agenda » (bonne date et heure sur Android).
- [ ] Gmail → *Afficher l'original* : SPF PASS, DKIM PASS.
- [ ] *Supabase → salon_leads* : la ligne contient l'e-mail, la source, la date de rappel et `email_sent_at`.

## D. Formulaire de dépôt (inchangé)
- [ ] Sur `/salon`, « Remplir le formulaire maintenant » descend jusqu'au formulaire.
- [ ] 📶 Dépôt avec **3 photos** prises avec l'appareil photo du téléphone : barres de progression, puis page Merci.
- [ ] 📶 Dépôt avec **10 photos** : aucune erreur, envoi en moins de 2 minutes.
- [ ] Moins de 3 photos : envoi bloqué avec un message clair.
- [ ] `/depot` fonctionne aussi directement.

## E. Outil (bureau)
- [ ] Connexion avec votre compte puis celui de François.
- [ ] Les demandes de C et D apparaissent dans *CRM* en « Nouvelle demande », avec leurs photos.
- [ ] Déplacer une carte : fenêtre de saisie, puis historique avec date et prénom.
- [ ] Fiche → *Télécharger les photos (ZIP)*.
- [ ] Charte appliquée sur le dashboard, le Kanban et une fiche.

## F. Sécurité et nettoyage
- [ ] `https://<adresse>/crm` dans une fenêtre privée renvoie vers la connexion.
- [ ] *Supabase → Authentication → Users* : uniquement vos deux comptes.
- [ ] Après la recette : supprimer les demandes et leads de test (*Table Editor* : `furnitures`, `salon_leads`).
- [ ] Une première sauvegarde (`supabase db dump`, DEPLOIEMENT §1.8) est faite avant le salon.
