# Déploiement — Remarq

Ordre recommandé : **1. Supabase → 2. Vercel → 3. E-mails (Resend) → 4. Domaine → 5. Shopify (liens courts)**.
Rien ici n'est automatisé : chaque étape se fait à la main dans les tableaux de bord. Ne collez jamais une clé secrète dans un fichier versionné ni dans une conversation.

---

## 1. Supabase (nouveau projet, Paris)

### 1.1 Ce qui dépend de Supabase

| Élément | Où | Mise en place |
|---|---|---|
| Tables, enums, vue `furniture_overview`, fonction `change_status()`, RLS | `supabase/migrations/20261021000001_init.sql` | `supabase db push` |
| Buckets privés `furniture-photos` et `attachments` + leur règle d'accès | même migration | `supabase db push` (rien à faire à la main) |
| Données de référence : 24 marques, 6 réglages | `supabase/migrations/20261021000002_seed_reference_data.sql` | `supabase db push` |
| Table `salon_leads` (landing du salon) | `supabase/migrations/20261031000003_salon_leads.sql` | `supabase db push` |
| Comptes de test locaux | `supabase/seed.sql` | **jamais en production** (`db push` ne l'exécute pas) |
| Données de démonstration | `scripts/load-demo.mjs` | **jamais en production** (le script refuse une base non locale) |

Variables lues par le code : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

### 1.2 Créer le projet
1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Nom : `remarq` · Région : **West EU (Paris) — eu-west-3** · Mot de passe de base : générez-le et rangez-le dans votre gestionnaire de mots de passe.
3. Notez la **référence du projet** (ex. `abcdefghijklmnop`) : elle figure dans l'URL du tableau de bord et dans *Project Settings → General*.

### 1.3 Pousser le schéma (depuis `remarq-outil/`)
```bash
npx supabase login
```
```bash
npx supabase link --project-ref <référence-du-projet>
```
```bash
npx supabase db push
```
La CLI demande le mot de passe de base de l'étape 1.2. Pour contrôler que la base distante correspond aux migrations (aucune différence attendue) :
```bash
npx supabase db diff --linked
```

### 1.4 Vérifier les buckets
*Storage* : `furniture-photos` et `attachments` doivent exister, tous les deux **privés** (pas de cadenas ouvert). *Storage → Policies* : une règle `authenticated_read_write_photos` sur `storage.objects`.

### 1.5 Réglages Auth
- *Authentication → Sign In / Providers* : fournisseur **Email** activé ; **Allow new users to sign up** décoché ; « Confirm email » peut rester activé (les comptes sont créés déjà confirmés).
- *Authentication → URL Configuration* :
  - **Site URL** : `https://outil.remarq.fr` (en attendant le DNS : `https://remarq-ten.vercel.app`)
  - **Redirect URLs** : `https://outil.remarq.fr/**`, `https://remarq-ten.vercel.app/**`, `https://*-remarq.vercel.app/**` (prévisualisations Vercel), `http://localhost:3100/**`
  La connexion se fait par e-mail + mot de passe, sans lien envoyé par e-mail : ces URL servent de filet de sécurité.

### 1.6 Créer les deux comptes
L'outil n'a pas de rôles : les deux comptes ont les mêmes droits.
1. *Authentication → Users → Add user → Create new user* : votre e-mail, un mot de passe solide, **Auto Confirm User** coché.
2. Même chose pour François.
3. *SQL Editor* → prénoms affichés dans l'historique :
```sql
update profiles set first_name = 'Martin'
where id = (select id from auth.users where email = 'votre@email');

update profiles set first_name = 'François'
where id = (select id from auth.users where email = 'email.de.francois@...');
```

### 1.7 Récupérer les clés
*Project Settings → API Keys* (ou *Data API*) :

| Variable | Valeur Supabase | Secret ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://<ref>.supabase.co`) | non |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | clé **publishable** (`sb_publishable_…`) ; à défaut la clé héritée **anon** | non (protégée par la RLS) |
| `SUPABASE_SECRET_KEY` | clé **secret** (`sb_secret_…`) ; à défaut la clé héritée **service_role** | **oui** : serveur uniquement |

Mettez-les à jour dans Vercel (§2) et, si vous travaillez sur la production depuis votre Mac, dans un fichier séparé — gardez `.env.local` pointé sur la base locale.

### 1.8 Sauvegardes et limites de l'offre gratuite
À confirmer sur [supabase.com/pricing](https://supabase.com/pricing) (sources tierces de 2026) :
- **Mise en pause** : un projet gratuit sans activité pendant **7 jours** est mis en pause ; il faut le relancer à la main depuis le tableau de bord. Les plans payants ne sont jamais mis en pause.
- **Sauvegardes** : pas de sauvegarde quotidienne restaurable sur l'offre gratuite (le plan Pro en inclut, sur plusieurs jours). Les sauvegardes de base **n'incluent pas les fichiers Storage** (photos, pièces jointes).
- **Stockage** : **1 Go** de fichiers sur l'offre gratuite, soit environ 100 à 200 meubles avec leurs photos.

**Recommandation** : passer au plan **Pro** (25 $/mois) dès que de vraies demandes arrivent — usage commercial, pas de mise en pause, sauvegardes quotidiennes, stockage bien plus large (montants exacts sur la page tarifs). En attendant, faites au minimum une sauvegarde hebdomadaire de la base :
```bash
npx supabase db dump --linked -f sauvegarde-$(date +%F).sql
```
```bash
npx supabase db dump --linked --data-only -f donnees-$(date +%F).sql
```
Rangez ces fichiers hors du dépôt git (ils contiennent les coordonnées des vendeurs).
