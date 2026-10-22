import { currentUser } from '../lib/auth.js';
import { configured, rawBase } from '../lib/store.js';
export default function handler(req, res) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Non connecté' });
  res.status(200).json({ user, rawBase: rawBase(), storageReady: configured() });
}
