import { checkPassword, createSession, users } from '../lib/auth.js';

const attempts = new Map(); // limite simple des essais (par instance)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!users().size) return res.status(500).json({ error: 'Aucun administrateur n’est encore configuré (variable ADMIN_USERS sur Vercel).' });

  const ip = String(req.headers['x-forwarded-for'] || 'local').split(',')[0].trim();
  const now = Date.now();
  const a = attempts.get(ip) || { n: 0, t: now };
  if (now - a.t > 15 * 60e3) { a.n = 0; a.t = now; }
  if (a.n >= 8) return res.status(429).json({ error: 'Trop d’essais. Réessayez dans 15 minutes.' });

  const { username, password } = req.body || {};
  const user = checkPassword(username, password);
  if (!user) {
    a.n++; attempts.set(ip, a);
    await new Promise(r => setTimeout(r, 700));
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
  }
  attempts.delete(ip);
  createSession(res, user);
  res.status(200).json({ user });
}
