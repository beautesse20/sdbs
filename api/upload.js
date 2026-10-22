import crypto from 'node:crypto';
import { guard } from '../lib/auth.js';
import { saveFile, configured } from '../lib/store.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const user = guard(req, res, { write: true });
  if (!user) return;
  if (!configured()) return res.status(500).json({ error: 'Le stockage n’est pas configuré.' });

  const { name, type, data } = req.body || {};
  const ext = TYPES[type];
  if (!ext || typeof data !== 'string') return res.status(400).json({ error: 'Format d’image non accepté (JPG, PNG ou WEBP).' });
  const buf = Buffer.from(data, 'base64');
  if (buf.length > 3.5 * 1024 * 1024) return res.status(413).json({ error: 'Image trop lourde.' });
  // Vérifie la signature du fichier
  const sig = buf.subarray(0, 12).toString('hex');
  const okSig = (ext === 'jpg' && sig.startsWith('ffd8ff')) || (ext === 'png' && sig.startsWith('89504e47')) ||
    (ext === 'webp' && sig.startsWith('52494646') && buf.subarray(8, 12).toString() === 'WEBP');
  if (!okSig) return res.status(400).json({ error: 'Ce fichier n’est pas une image valide.' });

  const slug = String(name || 'photo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo';
  const d = new Date();
  const rel = `assets/uploads/${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${crypto.randomBytes(3).toString('hex')}-${slug}.${ext}`;
  try {
    await saveFile(rel, data, user);
  } catch (e) {
    return res.status(502).json({ error: 'L’envoi de la photo a échoué : ' + e.message });
  }
  res.status(200).json({ path: '/' + rel });
}
