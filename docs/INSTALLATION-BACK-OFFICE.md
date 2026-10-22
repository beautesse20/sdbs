# Mise en service du back-office (à faire une seule fois, environ 10 minutes)

Le back-office se trouve à l’adresse **https://sdbs.vercel.app/admin** (ou à `/admin` derrière le nom que Vercel vous a donné).

Il fonctionne ainsi : quand un administrateur clique sur « Publier », le back-office enregistre les textes dans le dépôt GitHub `beautesse20/sdbs`, puis Vercel remet le site en ligne automatiquement en une ou deux minutes.

Pour cela, Vercel a besoin de deux réglages : **la liste des administrateurs** et **une clé d’accès GitHub**.

---

## Étape 1 : créer la clé d’accès GitHub

1. Connectez-vous à GitHub avec le compte **beautesse20**.
2. Ouvrez **https://github.com/settings/personal-access-tokens/new**.
3. Remplissez :
   - **Token name** : `SDBS back-office`
   - **Expiration** : la durée la plus longue proposée. Notez la date dans votre agenda : il faudra recréer une clé à l’expiration.
   - **Repository access** : choisissez **Only select repositories**, puis le dépôt **sdbs**.
   - **Permissions → Repository permissions → Contents** : choisissez **Read and write**.
4. Cliquez sur **Generate token** en bas de la page.
5. **Copiez la clé** qui s’affiche (elle commence par `github_pat_`). Elle ne sera plus jamais affichée : gardez-la le temps de l’étape 2.

> Cette clé donne le droit de modifier le dépôt du site, et seulement lui. Ne l’envoyez à personne et ne la collez jamais dans un fichier du site.

## Étape 2 : déclarer les réglages dans Vercel

1. Ouvrez **https://vercel.com**, puis le projet **sdbs**.
2. Allez dans **Settings → Environment Variables**.
3. Ajoutez la première variable :
   - **Key** : `GITHUB_TOKEN`
   - **Value** : la clé copiée à l’étape 1
   - Cliquez sur **Save**.
4. Ajoutez la deuxième variable :
   - **Key** : `ADMIN_USERS`
   - **Value** : les administrateurs, au format `identifiant:motdepasse`, séparés par un point-virgule. Exemple :

     ```
     emile:UnMotDePasseLong2026;elhadji:AutreMotDePasse!78;nane:EncoreUnAutre#45
     ```

   - Cliquez sur **Save**.

   Règles pour les identifiants et mots de passe :
   - L’identifiant est en minuscules, sans espace (par exemple le prénom).
   - Le mot de passe ne doit contenir ni `:` ni `;`.
   - Choisissez des mots de passe d’au moins 12 caractères, différents pour chaque personne.

## Étape 3 : redéployer une fois

1. Dans Vercel, ouvrez l’onglet **Deployments**.
2. Sur le déploiement le plus récent, cliquez sur **⋯** puis **Redeploy**.
3. Attendez que le statut passe à **Ready**.

C’est terminé. Ouvrez **/admin**, connectez-vous et faites un premier test : changez un mot, cliquez sur « Publier », puis rechargez le site une à deux minutes plus tard.

---

## Gérer les administrateurs ensuite

- **Ajouter ou retirer quelqu’un, changer un mot de passe** : modifiez la variable `ADMIN_USERS` dans Vercel (Settings → Environment Variables → ⋯ → Edit), puis refaites l’étape 3 (Redeploy). Une personne retirée de la liste est déconnectée immédiatement.
- **Une session dure 12 heures.** Ensuite, il faut se reconnecter. Les modifications non publiées sont conservées sur l’appareil.

## En cas de problème

| Message | Solution |
|---|---|
| « Aucun administrateur n’est encore configuré » | La variable `ADMIN_USERS` manque. Refaites l’étape 2, puis l’étape 3. |
| « Le stockage n’est pas configuré » | La variable `GITHUB_TOKEN` manque. Refaites l’étape 2, puis l’étape 3. |
| « Impossible de lire le contenu » ou « Bad credentials » | La clé GitHub a expiré ou a été mal copiée. Recréez-en une (étape 1), remplacez-la dans Vercel, puis faites l’étape 3. |
| « Quelqu’un d’autre a modifié le site entre-temps » | Deux personnes modifiaient en même temps. Rechargez la page et refaites la modification. |
| Le site ne change pas après « Publier » | Attendez deux minutes et rechargez la page. Si rien ne change, regardez l’onglet **Deployments** de Vercel. |

## Revenir à une ancienne version

Chaque publication est enregistrée dans l’historique GitHub (« Mise à jour du site par … »). En cas d’erreur grave, ouvrez https://github.com/beautesse20/sdbs/commits/main/content/site.json pour retrouver une version précédente, ou demandez à Claude Code de la restaurer.
