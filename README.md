# SDBS — site web et back-office

Site de la Senegalese Diaspora of BC Society, en français et en anglais, avec un back-office à `/admin`.

- **Mettre le back-office en service** : `docs/INSTALLATION-BACK-OFFICE.md`
- **Guide des administrateurs** : `docs/GUIDE-ADMINISTRATEURS.md`
- **Contexte pour Claude Code** : `CLAUDE.md`

## Comment ça marche

```
content/site.json   ← tous les textes, photos et réglages (modifiés par le back-office)
src/render.js       ← transforme site.json en page HTML (site + aperçu du back-office)
src/site.css, site.js
admin/              ← interface du back-office (/admin)
api/                ← connexion, lecture/écriture du contenu, envoi des photos (fonctions Vercel)
lib/                ← sessions et accès GitHub
assets/logo/        ← logos officiels ; assets/uploads/ ← photos envoyées depuis le back-office
build.js            ← génère /public (exécuté par Vercel)
```

Publier depuis `/admin` enregistre `content/site.json` sur GitHub ; Vercel reconstruit le site automatiquement.

## Tester sur un ordinateur

```bash
LOCAL_DEV=1 ADMIN_USERS="test:test1234" node dev-server.js
# puis ouvrir http://localhost:3000 et http://localhost:3000/admin
```

En mode test, les modifications sont écrites dans les fichiers locaux, pas sur GitHub.
