# Remarq — outil interne

Réception des demandes de vente (formulaire public), suivi de chaque meuble dans un CRM Kanban, finances et marge, e-mails pré-rédigés à copier/coller, textes de mise en ligne générés par IA.
Stack : Next.js 15 + TypeScript + Tailwind · Supabase (Auth, Postgres, Storage) · API Anthropic · Vercel.

| Écran | URL | Accès |
|---|---|---|
| Formulaire de dépôt / confirmation | `/depot`, `/depot/merci` | public |
| Connexion | `/connexion` | public |
| Dashboard · CRM · Tous les meubles · Fiche · Réglages | `/`, `/crm`, `/meubles`, `/meubles/[id]`, `/reglages` | connecté |

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

## 2. Supabase (production)

1. Créez un projet sur [supabase.com](https://supabase.com) (région **eu-west-3 Paris** de préférence), notez le mot de passe de la base.
2. Appliquez le schéma depuis ce dossier :
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-du-projet>
   npx supabase db push
   ```
   Les migrations créent les tables, la sécurité (RLS), les deux buckets privés (`furniture-photos`, `attachments`), les 24 marques de départ et les réglages par défaut.
3. **Désactiver les inscriptions** : *Authentication → Sign In / Providers* → décochez **Allow new users to sign up** (laissez le fournisseur *Email* activé).
4. **URL du site** : *Authentication → URL Configuration* → Site URL = `https://outil.mobilistore.fr`.
5. **Clés** : *Project Settings → API Keys* → copiez la clé **publishable** et la clé **secret** (voir §3).

### Créer les 2 comptes

*Authentication → Users → Add user → Create new user* : e-mail + mot de passe, cochez **Auto Confirm User**. Répétez pour le salarié.

Le prénom affiché dans l'historique (« préparé par Martin ») est déduit de l'e-mail ; corrigez-le dans *SQL Editor* :

```sql
update profiles set first_name = 'Martin'
where id = (select id from auth.users where email = 'martin@mobilistore.fr');
```

---

## 3. Variables d'environnement

Modèle : `.env.example`.

| Variable | Où la trouver | Exposée au navigateur ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | oui |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → *publishable* | oui (protégée par la RLS) |
| `SUPABASE_SECRET_KEY` | Supabase → API Keys → *secret* | **non** — serveur uniquement |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | **non** — serveur uniquement |
| `ANTHROPIC_MODEL` | Défaut `claude-opus-5-5` ; ex. `claude-sonnet-5-5` pour réduire le coût | non |

---

## 4. Vercel

1. Poussez ce dossier sur un dépôt GitHub privé, puis *Vercel → Add New → Project → Import*. Framework : Next.js (détecté), aucune commande à changer.
2. *Settings → Environment Variables* : ajoutez les 5 variables du §3 (environnement *Production*, et *Preview* si besoin).
3. *Settings → Functions* : région **cdg1 (Paris)** recommandée (proche de Supabase Paris).
4. Déployez. La génération IA peut prendre jusqu'à ~1 min : la route déclare `maxDuration = 120` (pris en charge par défaut avec Fluid Compute).

> Le plan gratuit *Hobby* de Vercel est réservé à un usage non commercial ; pour un outil d'entreprise, prévoyez le plan *Pro*.

### Sous-domaine `outil.mobilistore.fr`

1. Vercel → *Project → Settings → Domains* → ajoutez `outil.mobilistore.fr`. Vercel affiche l'enregistrement attendu (en général **CNAME `outil` → `cname.vercel-dns.com`**).
2. Créez cet enregistrement là où le DNS de mobilistore.fr est géré :
   - **Domaine acheté/géré chez Shopify** : *Shopify admin → Paramètres → Domaines → mobilistore.fr → Gérer → Modifier les paramètres DNS → Ajouter un enregistrement personnalisé* → type **CNAME**, nom `outil`, valeur indiquée par Vercel.
   - **Domaine chez un registrar (OVH, Gandi, etc.)** : zone DNS → nouvel enregistrement **CNAME** `outil` avec la même valeur.
   - Ne touchez pas aux enregistrements existants (`@`, `www`) qui pointent vers Shopify.
3. Attendez la validation (quelques minutes à quelques heures) ; Vercel émet le certificat HTTPS automatiquement.
4. Sur le site Shopify, ajoutez un lien ou un bouton vers **https://outil.mobilistore.fr/depot** (ex. « Vendre un meuble »).

### Données de démonstration en production (facultatif)

Pour tester l'outil en ligne avant de l'utiliser pour de vrai :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SECRET_KEY=sb_secret_xxx npm run db:demo
# puis, pour tout retirer :
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SECRET_KEY=sb_secret_xxx npm run db:demo -- --remove
```

Les fiches de démo sont reconnaissables à leur e-mail vendeur `@demo.remarq.test` ; `--remove` ne supprime qu'elles.

---

## 5. Choix par défaut à confirmer

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
