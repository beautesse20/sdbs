import { guard } from '../lib/auth.js';
import { getContent, saveContent, configured } from '../lib/store.js';
import { renderPage } from '../src/render.js';

export default async function handler(req, res) {
  if (!configured()) return res.status(500).json({ error: 'Le stockage n’est pas configuré (variable GITHUB_TOKEN sur Vercel).' });

  if (req.method === 'GET') {
    if (!guard(req, res)) return;
    try {
      return res.status(200).json(await getContent());
    } catch (e) {
      return res.status(502).json({ error: 'Impossible de lire le contenu du site : ' + e.message });
    }
  }

  if (req.method === 'PUT') {
    const user = guard(req, res, { write: true });
    if (!user) return;
    const { content, sha } = req.body || {};
    if (!content || typeof content !== 'object' || !content.sections || !content.settings) {
      return res.status(400).json({ error: 'Contenu invalide.' });
    }
    if (JSON.stringify(content).length > 600000) return res.status(400).json({ error: 'Contenu trop volumineux.' });
    try { renderPage(content); } catch (e) {
      return res.status(400).json({ error: 'Le contenu ne peut pas être affiché : ' + e.message });
    }
    try {
      const out = await saveContent(content, sha, user);
      return res.status(200).json({ ok: true, sha: out.sha });
    } catch (e) {
      if (e.status === 409 || e.status === 422) {
        return res.status(409).json({ error: 'Quelqu’un d’autre a modifié le site entre-temps. Rechargez la page pour récupérer la dernière version.' });
      }
      return res.status(502).json({ error: 'La publication a échoué : ' + e.message });
    }
  }

  res.status(405).json({ error: 'Méthode non autorisée' });
}
