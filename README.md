# Remarq — outil interne

Réception des demandes de vente (formulaire public), suivi de chaque meuble dans un CRM Kanban, finances et marge, e-mails pré-rédigés à copier/coller, textes de mise en ligne générés par IA.
Stack : Next.js 15 + TypeScript + Tailwind · Supabase (Auth, Postgres, Storage) · API Anthropic · Vercel.

| Écran | URL | Accès |
|---|---|---|
| Formulaire de dépôt / confirmation | `/depot`, `/depot/merci` | public |
| Landing du salon · liens courts des QR · confidentialité | `/salon`, `/d/<source>`, `/confidentialite` | public |
| Connexion | `/connexion` | public |
| Dashboard · CRM · Tous les meubles · Fiche · Réglages · QR codes | `/`, `/crm`, `/meubles`, `/meubles/[id]`, `/reglages`, `/reglages/qr` | connecté |

**Déploiement (Supabase, Vercel, Resend, domaine, Shopify) : voir [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md).** Recette avant mise en ligne : [`docs/RECETTE.md`](docs/RECETTE.md).

---

## 1. Développement local

Prérequis : Node 20+ (testé avec Node 24), Docker Desktop lancé.

```bash
npm install
npx playwright install chromium   # une fois, pour les tests de bout en bout
npm run db:start                  # Supabase local (ports 544xx)
npm run dev                       # http://localhost:3100
```

`.env.local` est déjà prérempli pour la base locale (clés de démonstration publiques de la CLI Supabase). Ajoutez votre `ANTHROPIC_API_KEY` pour tester la génération des textes.

Comptes locaux créés par `supabase/seed.sql` : `martin@remarq.test` / `salarie@remarq.test`, mot de passe `remarq-local-1234`.

| Commande | Effet |
|---|---|
| `npm run db:reset` | Réapplique migrations + comptes de test (vide la base locale) |
| `npm run db:demo` | Charge ~38 meubles fictifs sur 12 mois (facultatif) |
| `npm run db:demo -- --remove` | Supprime toutes les données de démo |
| `npm run db:types` | Régénère `lib/database.types.ts` après une migration |
| `npm run test` | Tests unitaires (marge, ancienneté, compteur 15 j, e-mails, transitions, dashboard) |
| `npm run test:e2e` | Tests de bout en bout (formulaire mobile, Kanban, fiche, finances, ZIP, dashboard, réglages) |
| `npm run typecheck && npm run lint && npm run build` | Vérifications avant déploiement |

Studio Supabase local : http://127.0.0.1:54423.

---

## 2. Mise en production

Tout est dans [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md) : nouveau projet Supabase (Paris), variables Vercel, e-mails Resend et enregistrements DNS, sous-domaine `sell.remarq.fr`, redirections Shopify `remarq.fr/d/…` des QR codes. Liste de vérifications sur mobile : [`docs/RECETTE.md`](docs/RECETTE.md).

---

## 3. Choix par défaut à confirmer

| Point | Valeur appliquée | Où le changer |
|---|---|---|
| Libellé du statut de clôture | « Nouvelle vie » | `lib/status.ts` |
| Nom de la boutique / signature | « Remarq » / « L'équipe {{boutique}} » | Réglages |
| Taux horaire | 0 € (temps non valorisé) ; s'applique rétroactivement à toutes les marges | Réglages |
| Validité des propositions / délai non-conformité | 7 j / 15 j (le mail « Non conforme » suit le délai) | Réglages |
| Adresse de l'atelier | vide → « [à compléter] » dans le mail | Réglages |
| Abandon d'un non-conforme (délai dépassé) | bascule en **rachat à 0 €**, modifiable | fenêtre « En préparation » |
| Lignes d'ajustement | dépense = montant négatif | fiche → Finances |
| Modèle IA | `claude-opus-5-5` | `ANTHROPIC_MODEL` |
