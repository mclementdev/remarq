# Remarq — outil interne

Outil interne de réception, suivi et mise en ligne de mobilier de design d'occasion (rachat / dépôt-vente). Hébergé sur un sous-domaine de mobilistore.fr, **sans aucune connexion** à Shopify, Leboncoin, au transporteur ni à un service d'e-mail.
Spécifications : `CAHIER_DES_CHARGES.md` (source de vérité) et `EMAILS_MODELES.md`.

## Stack
- Next.js 15 (App Router, Server Components, Server Actions) + TypeScript strict + Tailwind CSS v4
- Supabase : Auth (e-mail + mot de passe, inscription désactivée), Postgres (RLS partout), Storage (buckets privés, URL signées)
- API Anthropic côté serveur uniquement (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`)
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
- Clé secrète Supabase uniquement dans `lib/supabase/admin.ts` (`server-only`), utilisée seulement par les routes publiques contrôlées `app/api/depot/*`.
- Thème (repris de mobilistore.fr) : variables dans `app/globals.css` (`@theme`) et utilitaires `btn-primary`, `btn-secondary`, `field`, `panel`, `badge`… Boutons en majuscules.
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
```
Comptes locaux (seed) : `martin@remarq.test` et `salarie@remarq.test`, mot de passe `remarq-local-1234`.
Nouvelle migration : `npx supabase migration new <nom>` puis `npm run db:reset`.

## Périmètre — ce qu'on NE développe PAS (§2)
- Aucun envoi d'e-mail (pas de SMTP, Resend…) : les mails sont **pré-rédigés à copier/coller** (+ lien `mailto:` facultatif).
- Aucune API Shopify, Leboncoin, transporteur. Seule API externe : Anthropic (textes de mise en ligne).
- Pas de RGPD/CGU/bandeau cookies/anti-spam, pas de rôles ni permissions (2 utilisateurs, mêmes droits), pas de comptes clients ni suivi côté client, pas de fiche client multi-meubles (coordonnées intégrées au meuble).
- Pas de gestion des litiges, export CSV, retouche photo, reprise de données.
- Pas de formule automatique de prix de rachat ni de contrat de dépôt-vente.
- Pas d'autre langue que le français.
