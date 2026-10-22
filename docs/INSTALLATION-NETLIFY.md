# Mettre le site et le back-office sur Netlify (environ 15 minutes)

Le site, le back-office et le contenu restent sur GitHub (`beautesse20/sdbs`). Netlify se branche sur ce dépôt et remet le site en ligne à chaque publication.

## Étape 1 : importer le dépôt dans Netlify

1. Ouvrez **https://app.netlify.com** et connectez-vous avec **GitHub**.
2. Cliquez sur **Add new project → Import an existing project → GitHub**.
3. Autorisez Netlify si GitHub le demande, puis choisissez le dépôt **sdbs**.
4. Netlify lit automatiquement le fichier `netlify.toml` : **ne modifiez rien** dans les réglages de build.
5. Avant de cliquer sur Deploy, ouvrez **Add environment variables** (ou faites l’étape 3 juste après le premier déploiement).
6. Cliquez sur **Deploy**.

## Étape 2 : choisir l’adresse du site

1. Dans le projet Netlify : **Project configuration → General → Project details → Change project name**.
2. Tapez `sdbs` (ou `sdbs-bc` si le nom est pris). L’adresse devient **https://sdbs.netlify.app**.

## Étape 3 : les deux réglages du back-office

Dans **Project configuration → Environment variables → Add a variable** :

| Key | Value |
|---|---|
| `GITHUB_TOKEN` | la clé GitHub (`github_pat_…`), voir ci-dessous |
| `ADMIN_USERS` | `identifiant:motdepasse;identifiant2:motdepasse2` |

Pour la clé GitHub : https://github.com/settings/personal-access-tokens/new → nom `SDBS back-office` → **Only select repositories : sdbs** → **Contents : Read and write** → Generate token → copiez la clé.

Règles pour `ADMIN_USERS` : identifiants en minuscules sans espace ; mots de passe d’au moins 12 caractères, sans `:` ni `;`.

## Étape 4 : redéployer

**Deploys → Trigger deploy → Deploy project.** Attendez le statut **Published**.

## Étape 5 : tester

1. Ouvrez **https://sdbs.netlify.app/admin** et connectez-vous.
2. Dans **Coordonnées et réglages**, mettez **Adresse du site** à `https://sdbs.netlify.app`.
3. Cliquez sur **Publier**, puis rechargez le site une à deux minutes plus tard.

## Étape 6 : arrêter Vercel (facultatif)

Une fois Netlify en ligne, supprimez le projet sur Vercel (**Settings → Advanced → Delete Project**) pour éviter d’avoir deux copies du site. Rien n’est perdu : tout est sur GitHub.

## En cas de problème

| Message | Solution |
|---|---|
| « Aucun administrateur n’est encore configuré » | `ADMIN_USERS` manque : étape 3 puis étape 4. |
| « Le stockage n’est pas configuré » | `GITHUB_TOKEN` manque : étape 3 puis étape 4. |
| « Bad credentials » | Clé GitHub expirée ou mal copiée : recréez-la, remplacez-la, redéployez. |
| Erreur 404 sur /api/... | Vérifiez que `netlify.toml` et le dossier `netlify/functions` sont bien dans le dépôt. |
