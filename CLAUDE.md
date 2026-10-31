# Remarq — outil interne

Outil de **Remarq** (anciennement Mobilistore) : réception, suivi et mise en ligne de mobilier de design d'occasion (rachat / dépôt-vente). Servi sur `sell.remarq.fr` (en attendant : `remarq-ten.vercel.app`) ; la boutique remarq.fr reste sur Shopify, **sans connexion API** pour l'instant.
Spécifications : `CAHIER_DES_CHARGES.md`, `EMAILS_MODELES.md`, et pour la suite `../ARCHITECTURE/BRIEF_CLAUDE_CODE_SHOPIFY.md` (hors dépôt).
Pages publiques : `/depot` (formulaire de dépôt, **ne pas modifier sans demande explicite**), `/salon` (landing Époqu'Auto, textes dans `lib/content/salon.ts`), `/d/<source>` (liens courts des QR), `/confidentialite`.
Déploiement : `docs/DEPLOIEMENT.md` ; recette : `docs/RECETTE.md`.

## Stack
- Next.js 15 (App Router, Server Components, Server Actions) + TypeScript strict + Tailwind CSS v4
- Supabase : Auth (e-mail + mot de passe, inscription désactivée), Postgres (RLS partout), Storage (buckets privés, URL signées)
- API Anthropic côté serveur uniquement (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`)
- Resend (e-mails de la landing uniquement, `lib/email/send.ts`) : sans `RESEND_API_KEY`, l'e-mail est journalisé
- URL absolues via `lib/site-url.ts` (`NEXT_PUBLIC_SITE_URL`, sinon adresse Vercel) : jamais d'URL en dur
- dnd-kit (Kanban), JSZip (ZIP photos), browser-image-compression, recharts, zod, date-fns + @date-fns/tz
- Tests : Vitest (`tests/unit`), Playwright (`tests/e2e`)
- Déploiement : Vercel

## Conventions
- **Interface 100 % française** (libellés, messages d'erreur, formats `1 234,50 €`, dates `21/10/2026`).
- **Code, clés, noms de tables/colonnes/enums en anglais.** Les libellés FR vivent dans `lib/status.ts` (statuts) et `lib/labels.ts` (autres enums) : ne jamais écrire un libellé de statut ailleurs.
- Montants en euros TTC, aucune TVA. Lignes d'ajustement signées : **dépense = montant négatif**.
- Jours / ancienneté calculés en calendrier **Europe/Paris** (`lib/calc/aging.ts`).
- Calculs métier (marge, ancienneté, dashboard) = fonctions pures dans `lib/calc/*`, couvertes par Vitest.
- Changement de statut uniquement via la fonction SQL `change_status()` (journalise dans `status_history`).
- Clé secrète Supabase uniquement dans `lib/supabase/admin.ts` (`server-only`), utilisée seulement par les routes publiques contrôlées `app/api/depot/*` et `app/api/salon/*`.
- Charte Remarq : Alte Haas Grotesk (`public/fonts`, licence à garder à côté), jetons dans `app/globals.css` (`@theme` : `cream`, `paper`, `ink`, `accent`…) et utilitaires `btn-primary`, `field`, `panel`, `badge`… Boutons en majuscules, rayon 2 px, aucune ombre. Logo : mot « REMARQ » provisoire tant que `public/brand/` ne contient pas les fichiers officiels — ne jamais inventer de logo.
- Modèles d'e-mails : `lib/emails/templates.ts`, variables `{{prenom}}`, zones `[à compléter : …]`.

## Commandes
```bash
npm run db:start      # Supabase local (Docker) — ports 544xx (API 54421, Studio 54423)
npm run db:reset      # réapplique migrations + seed local (2 comptes de test)
npm run db:demo       # charge les données de démonstration (facultatif ; -- --remove pour les retirer)
npm run db:types      # régénère lib/database.types.ts après une migration
npm run dev           # http://localhost:3100
npm run typecheck && npm run lint
npm run test          # Vitest
npm run test:e2e      # Playwright (Supabase local démarré requis)
npm run build
npm run qr            # régénère public/qr/*.svg (QR_BASE_URL, défaut https://remarq.fr)
```
Comptes locaux (seed) : `martin@remarq.test` et `salarie@remarq.test`, mot de passe `remarq-local-1234`.
Nouvelle migration : `npx supabase migration new <nom>` puis `npm run db:reset`.

## Périmètre — ce qu'on NE développe PAS (§2)
- E-mails automatiques : **uniquement** le lien envoyé depuis la landing du salon (Resend). Les mails du CRM restent **pré-rédigés à copier/coller** ; pas d'e-mail au dépôt d'une demande pour l'instant.
- Aucune API Shopify, Leboncoin, transporteur (Shopify : phase 2 du brief). APIs externes : Anthropic (textes) et Resend (landing).
- Pas de données de démonstration en production (`load-demo.mjs` refuse une base non locale).
- Pas de bandeau cookies ; RGPD limité au consentement et à la page `/confidentialite` (provisoire). Pas de rôles ni permissions (2 utilisateurs, mêmes droits), pas de comptes clients ni suivi côté client, pas de fiche client multi-meubles (coordonnées intégrées au meuble).
- Pas de gestion des litiges, export CSV, retouche photo, reprise de données.
- Pas de formule automatique de prix de rachat ni de contrat de dépôt-vente.
- Pas d'autre langue que le français.
