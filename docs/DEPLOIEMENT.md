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
  - **Site URL** : `https://sell.remarq.fr` (en attendant le DNS : `https://remarq-ten.vercel.app`)
  - **Redirect URLs** : `https://sell.remarq.fr/**`, `https://remarq-ten.vercel.app/**`, `https://*-remarq.vercel.app/**` (prévisualisations Vercel), `http://localhost:3100/**`
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

---

## 2. Vercel (projet existant)

### 2.1 Variables d'environnement
*Vercel → projet → Settings → Environment Variables*. Remplacez les anciennes valeurs Supabase et ajoutez les nouvelles :

| Variable | Production | Preview | Development | Valeur |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ | §1.7 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✓ | ✓ | ✓ | §1.7 |
| `SUPABASE_SECRET_KEY` | ✓ | ✓ | ✓ | §1.7 — **secret** |
| `ANTHROPIC_API_KEY` | ✓ | ✓ | | inchangée — **secret** |
| `ANTHROPIC_MODEL` | ✓ | ✓ | | `claude-opus-5-5` |
| `NEXT_PUBLIC_SITE_URL` | ✓ | | | `https://sell.remarq.fr` **une fois le domaine actif** (§4). Avant : ne pas la définir, l'application utilise son adresse `*.vercel.app`. Jamais en Preview. |
| `NEXT_PUBLIC_SHOP_URL` | ✓ | ✓ | | `https://remarq.fr` (valeur par défaut si absente) |
| `RESEND_API_KEY` | ✓ | | | §3 — **secret**. Absente en Preview : les e-mails sont journalisés, pas envoyés. |
| `EMAIL_FROM` | ✓ | ✓ | | `Remarq <contact@remarq.fr>` |
| `EMAIL_REPLY_TO` | ✓ | ✓ | | adresse qui reçoit les réponses (facultatif) |

Les variables `NEXT_PUBLIC_*` sont intégrées au moment du build : **après toute modification, redéployez** (*Deployments → ⋯ → Redeploy*).

### 2.2 Vérifications après redéploiement (sur l'adresse de production)
- [ ] `/connexion` : connexion avec votre compte, puis celui de François.
- [ ] `/depot` sur téléphone : demande avec 3 photos → page Merci.
- [ ] La demande apparaît dans *CRM* en « Nouvelle demande », avec ses photos.
- [ ] Glisser la carte vers « Accepté » : la fenêtre s'ouvre, l'historique de la fiche montre le changement avec votre prénom.
- [ ] Fiche → *Mise en ligne* → **Télécharger les photos (ZIP)** : le fichier contient les photos.
- [ ] `/salon` : envoi du lien à votre adresse → e-mail reçu (§3).
- [ ] *Supabase → Authentication → Users* : aucun compte inconnu (inscriptions fermées).

---

## 3. E-mails (Resend)

Seule la landing du salon envoie des e-mails (lien du formulaire + invitation d'agenda). Aucun e-mail n'est envoyé au dépôt d'une demande.

1. Créez un compte sur [resend.com](https://resend.com) (l'offre gratuite suffit pour le salon ; quotas à vérifier sur la page tarifs).
2. *Domains → Add Domain* : `remarq.fr`, région **Ireland (eu-west-1)**.
3. Resend affiche les enregistrements à créer dans le DNS de remarq.fr, **géré par Shopify** : *Shopify admin → Paramètres → Domaines → remarq.fr → Paramètres DNS → Ajouter un enregistrement personnalisé* (même endroit qu'au §4). Ils sont de cette forme ; **copiez les valeurs exactes depuis Resend**, surtout la clé DKIM, propre à votre compte :

   | Type | Nom (hôte) | Valeur | Rôle |
   |---|---|---|---|
   | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEB…` (longue clé, à copier) | DKIM |
   | CNAME | `send` | `send.forge.rmta.net` | SPF (envoi) |
   | CNAME | `rsend` | `rsend-euw1.forge.rmta.net` | SPF (retours, région Irlande) |
   | TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC (recommandé ; **seulement s'il n'existe pas déjà**) |

   Resend a changé de format : l'ancien couple MX + TXT sur `send` (`feedback-smtp…amazonses.com`, `v=spf1 include:amazonses.com ~all`) **ne doit plus être utilisé**. Un CNAME ne peut pas coexister avec d'autres enregistrements du même nom : supprimez ces anciens MX et TXT `send` s'ils existent. **Recopiez toujours ce qu'affiche Resend**, qui fait foi.
   Ces enregistrements concernent les sous-domaines `send`, `rsend` et `resend._domainkey` : ils **ne touchent pas** au SPF ni aux MX existants de `remarq.fr` (e-mails de Shopify et boîte `contact@`).
4. Attendez le statut **Verified** dans Resend (quelques minutes à quelques heures).
5. *API Keys → Create API Key* : droit **Sending access**, domaine `remarq.fr`. Copiez-la dans Vercel → `RESEND_API_KEY` (Production uniquement). Ne la mettez nulle part ailleurs.
6. `EMAIL_FROM` = `Remarq <contact@remarq.fr>`. Pour recevoir les réponses, `contact@remarq.fr` doit être une vraie boîte (ou renseignez `EMAIL_REPLY_TO` avec une adresse relevée).
7. Redéployez, puis testez `/salon` avec votre propre adresse : vérifiez l'e-mail, l'invitation `.ics` (ouvrez-la dans votre agenda) et le lien Google Agenda. Dans Gmail, *Afficher l'original* doit indiquer **SPF : PASS** et **DKIM : PASS**.

   Contrôle depuis un terminal : `dig +short CNAME send.remarq.fr` et `dig +short CNAME rsend.remarq.fr` doivent renvoyer les valeurs ci-dessus.

Sans `RESEND_API_KEY` (local, prévisualisations), l'e-mail est écrit dans les journaux au lieu d'être envoyé ; le lead est quand même enregistré. Les leads sont visibles dans *Supabase → Table Editor → salon_leads* (colonne `email_error` en cas d'échec d'envoi).

---

## 4. Domaine `sell.remarq.fr`

Le domaine principal `remarq.fr` reste sur Shopify : on n'ajoute qu'un sous-domaine.

1. *Vercel → projet → Settings → Domains → Add* : `sell.remarq.fr`. Vercel affiche l'enregistrement à créer, en général :
   | Type | Nom | Valeur |
   |---|---|---|
   | CNAME | `outil` | la valeur affichée par Vercel (de la forme `xxxx.vercel-dns-017.com` ou `cname.vercel-dns.com`) |
2. Créez-le dans le DNS de remarq.fr, **géré par Shopify** : *Shopify admin → Paramètres → Domaines → remarq.fr → Paramètres DNS → Ajouter un enregistrement personnalisé*. Ne modifiez pas les enregistrements `@` et `www`.
3. Propagation : de quelques minutes à 24 h (souvent moins d'une heure). Vercel passe le domaine en « Valid Configuration » et émet le certificat HTTPS automatiquement.
4. Vérification : `https://sell.remarq.fr/connexion` s'ouvre avec le cadenas ; le certificat est délivré pour `sell.remarq.fr`.
5. Ensuite seulement : `NEXT_PUBLIC_SITE_URL=https://sell.remarq.fr` (Production) → redéploiement ; Supabase → *Site URL* = `https://sell.remarq.fr` ; redirections Shopify (§5) vers le nouveau domaine.

Tant que le DNS n'est pas en place, tout fonctionne sur `https://remarq-ten.vercel.app`.

---

## 5. Liens courts et QR codes (Shopify)

Les QR codes imprimés pointent vers **`https://remarq.fr/d/<source>`** : une adresse sous votre contrôle, valable quel que soit l'hébergement de l'outil. On peut donc imprimer avant que `sell.remarq.fr` existe.

*Shopify admin → Contenu → Menus → Redirections d'URL* → **Importer** le fichier `docs/shopify/redirections-vercel.csv` (puis `redirections-sell.csv` après le §4, en cochant le remplacement des redirections existantes), ou **Créer une redirection d'URL** pour chaque ligne :

| Rediriger depuis | Vers (avant le domaine) | Vers (après le domaine) |
|---|---|---|
| `/d/stand` | `https://remarq-ten.vercel.app/d/stand` | `https://sell.remarq.fr/d/stand` |
| `/d/carte` | `https://remarq-ten.vercel.app/d/carte` | `https://sell.remarq.fr/d/carte` |
| `/d/flyer` | `https://remarq-ten.vercel.app/d/flyer` | `https://sell.remarq.fr/d/flyer` |
| `/d/ig` | `https://remarq-ten.vercel.app/d/ig` | `https://sell.remarq.fr/d/ig` |
| `/d/carjager` | `https://remarq-ten.vercel.app/d/carjager` | `https://sell.remarq.fr/d/carjager` |

Les redirections Shopify ne fonctionnent que si la boutique **n'est pas protégée par mot de passe** (sinon le visiteur voit la page de mot de passe) et ne s'appliquent qu'aux adresses qui n'existent pas déjà dans la boutique. Elles sont permanentes (301) : un téléphone qui a déjà scanné peut garder l'ancienne cible en mémoire, d'où l'intérêt de laisser `remarq-ten.vercel.app` en service après le passage à `sell.remarq.fr`.

Test : scannez chaque QR (`public/qr/*.svg`, téléchargeables dans *Réglages → QR codes*) avec un téléphone, **avant l'impression**.
