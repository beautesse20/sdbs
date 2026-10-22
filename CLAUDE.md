# Site SDBS — instructions pour Claude Code

Site de la **Senegalese Diaspora of BC Society (SDBS)**, association à but non lucratif de Colombie-Britannique, fondée le 26 octobre 2024. Siège : 9196 140 St, Surrey, BC V3V 5Z2.

Réponds en français, de façon concise. Livre des fichiers complets plutôt que des extraits.

## Hébergement

- Dépôt GitHub : `beautesse20/sdbs` (branche `main`).
- Vercel : projet importé depuis le dépôt (Framework Preset : **Other**). Les réglages de build viennent de `vercel.json`. Chaque commit sur `main` redéploie le site automatiquement.
- URL prévue : https://sdbs.vercel.app (réglable dans `settings.siteUrl` de `content/site.json`).

## Architecture

Le site est généré à partir d’un fichier de contenu, modifiable par les administrateurs via `/admin`.

- `content/site.json` : **source unique** de tous les textes (bilingues `{fr, en}`), photos, réglages, ordre et visibilité des sections. C’est ce fichier que le back-office modifie.
- `src/render.js` : module ES sans dépendance qui transforme `site.json` en HTML. Utilisé par `build.js` (site) et par `admin/admin.js` (aperçu). Tout texte passe par `esc()`.
- `src/site.css`, `src/site.js` : styles et script du site public (langue FR/EN, menu mobile, masquage des événements passés, liens WhatsApp).
- `build.js` : génère `public/` (Vercel : `buildCommand: node build.js`, `outputDirectory: public`, voir `vercel.json`).
- `admin/` : back-office (HTML/CSS/JS sans framework). Les formulaires sont décrits par le tableau `SCHEMA` dans `admin/admin.js` : pour rendre un nouveau champ modifiable, ajoutez-le dans `content/site.json`, dans `render.js`, puis dans `SCHEMA`.
- `api/` (fonctions Vercel) : `login`, `logout`, `me`, `content` (GET/PUT avec contrôle de version `sha`), `upload` (photos JPG/PNG/WEBP, signature vérifiée, enregistrées dans `assets/uploads/`).
- `lib/auth.js` : sessions signées HMAC dans un cookie HttpOnly/Secure/SameSite=Strict (12 h). Les écritures exigent l’en-tête `X-SDBS-Admin: 1`.
- `lib/store.js` : lecture/écriture via l’API GitHub Contents (`beautesse20/sdbs`, branche `main`). En local (`LOCAL_DEV=1`), écrit dans les fichiers.
- `vercel.json` : `ignoreCommand` saute le build quand seul `assets/uploads/` change (l’envoi d’une photo ne redéploie pas ; la publication suivante l’inclut).

Variables Vercel : `ADMIN_USERS` (`id:motdepasse;id2:motdepasse2`), `GITHUB_TOKEN` (jeton à grain fin, Contents read/write sur le seul dépôt sdbs). Facultatives : `SESSION_SECRET`, `GITHUB_REPO`, `GITHUB_BRANCH`. Aucun secret ne doit être écrit dans le dépôt.

Test local : `LOCAL_DEV=1 ADMIN_USERS="test:test1234" node dev-server.js` puis http://localhost:3000/admin.

Documentation utilisateur : `docs/INSTALLATION-BACK-OFFICE.md` (mise en service) et `docs/GUIDE-ADMINISTRATEURS.md`.

## Charte graphique (à respecter)

- Police : **Poppins** (gras pour les titres, regular pour le texte).
- Couleurs : vert SDBS `#0B3D2E` (principal), vert Sénégal `#00853F`, or teranga `#F5C400` (jamais en texte sur fond blanc), rouge `#E31B23` (petites touches seulement), bleu C.-B. `#2A6FAE`. Répartition : environ 60 % blanc, 25 % vert SDBS, 15 % accents.
- **Filet tricolore** vert/or/rouge en haut et en bas de page.
- Devise : UNITED · SUPPORTIVE · COMMITTED (Unis · Solidaires · Engagés).
- Nom complet : « Senegalese Diaspora of BC Society », sigle « SDBS » (sans points).
- Majuscule au début des titres seulement. Pas d'émoji. Aucun message partisan ni symbole religieux dans les visuels.
- Ne jamais déformer, recolorer ou redessiner le logo.

## Décisions déjà prises

- Le numéro de société (S0081364) **ne doit pas** apparaître sur le site.
- L'encadré « En bref » affiche le président (Emile Nioke) et le secrétaire général (El Hadji Ka).
- Adhésion : « Avoir 18 ans ou plus… », « Régler la cotisation annuelle », « Les plus jeunes participent aux activités avec l'autorisation de leurs parents ». Pas de bouton « Appeler » dans ce bloc.
- Contact : téléphone et WhatsApp au (672) 558-3698. Aucune adresse courriel n'est encore fournie.
- La galerie « Photos » n’apparaît que si au moins une photo est ajoutée depuis le back-office.

## Bureau élu (source : docs/communique-nouveau-bureau.jpg)

- Président : Emile Nioke. 1er vice-président : Oumar Fall. 2e vice-présidente : Kisita Ndao.
- Secrétaire général : El Hadji Ka. Adjoint : Mathurin Boissy.
- Trésorier général : Papa Momar Dieng. Adjointe : Ndeye Niangha Sakho.
- Commissions :
  - Culture : Adrien Mané (adjoint : Mahamadou Diallo)
  - Relations publiques : Abdalah Mbaye (adjoint : Serigne Donde)
  - Organisation : Adama Kandji (avec Albert Fale et Mame Diarra Bousso)
  - Social : Tening Ndong
  - Accueil & intégration : Cheikh Ibra Sene
  - Religion : Ousseynou Mbacké
  - Sport : Oumar Fall
  - Communication & sages : Soukeyna Magassa (adjointe : Mireille Sandra Thiaw)

## Back-office

Livré et testé localement (connexion, modification, photos, galerie, événements, aperçu, brouillon automatique, publication). Pour toute nouvelle demande de modification du site, préférer rendre le contenu modifiable dans le back-office plutôt que de l’écrire en dur.
