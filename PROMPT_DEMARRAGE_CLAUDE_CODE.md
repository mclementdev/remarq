# Prompt de démarrage pour Claude Code

À coller dans Claude Code, lancé depuis le dossier du projet (celui qui contient `CAHIER_DES_CHARGES.md` et `EMAILS_MODELES.md`).

---

Tu vas construire la V1 d'un outil interne de gestion de mobilier d'occasion haut de gamme. Le contexte, le périmètre, les écrans, les statuts, le modèle de données et les critères d'acceptation sont dans `CAHIER_DES_CHARGES.md`. Les e-mails sont dans `EMAILS_MODELES.md`. Lis les deux fichiers en entier avant de faire quoi que ce soit.

Consignes :
1. Commence en **mode plan** : propose-moi l'architecture, le schéma SQL Supabase, l'arborescence des pages et le découpage en étapes (en suivant l'ordre du §16). Signale les ambiguïtés ou contradictions que tu vois dans le cahier des charges, et attends ma validation avant d'écrire du code.
2. Crée un `CLAUDE.md` à la racine qui résume : la stack, les conventions (interface 100 % française, code et clés en anglais), les commandes utiles et les règles du périmètre (§2 : ce qu'on ne développe pas).
3. Stack : Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, Storage) + déploiement Vercel. Je dispose déjà des comptes Vercel et Supabase.
4. **Design** : récupère le HTML/CSS de https://mobilistore.fr, extrais polices, couleurs et styles de boutons, et reprends-les comme variables du thème. Si l'extraction ne suffit pas, demande-moi une capture d'écran.
5. Ne développe rien de ce qui est listé « hors périmètre » (aucun envoi d'e-mail, aucune API externe sauf Anthropic pour les textes de mise en ligne).
6. Avance étape par étape : à la fin de chaque étape, fais tourner le projet, vérifie-le (tests unitaires sur les calculs de marge et d'ancienneté, test de bout en bout du formulaire et du Kanban), puis fais-moi un court récapitulatif de ce qui fonctionne et de ce que je dois tester.
7. À la fin : `README.md` de déploiement (variables d'environnement, création des 2 comptes dans Supabase, sous-domaine Vercel et enregistrement DNS) et données de démonstration facultatives (désactivables) pour que je puisse tester.

Les valeurs « À CONFIRMER » ont une valeur par défaut : utilise-la et signale-la-moi dans ton récapitulatif.
