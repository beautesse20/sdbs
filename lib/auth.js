import crypto from 'node:crypto';

const COOKIE = 'sdbs_admin';
const HOURS = 12;

// ADMIN_USERS = "emile:motdepasse1;elhadji:motdepasse2" (un administrateur par paire, séparés par ; ou retour à la ligne)
export function users() {
  const raw = process.env.ADMIN_USERS || '';
  const map = new Map();
  raw.split(/[;\n]+/).map(s => s.trim()).filter(Boolean).forEach(pair => {
    const i = pair.indexOf(':');
    if (i > 0) map.set(pair.slice(0, i).trim().toLowerCase(), pair.slice(i + 1).trim());
  });
  return map;
}

function secret() {
  return process.env.SESSION_SECRET ||
    crypto.createHash('sha256').update('sdbs|' + (process.env.ADMIN_USERS || '') + '|' + (process.env.GITHUB_TOKEN || '')).digest('hex');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const list = users();
  const expected = list.get(u);
  // Toujours comparer, même si l'utilisateur n'existe pas (temps constant)
  const ok = safeEqual(password || '', expected || crypto.randomBytes(16).toString('hex'));
  return expected !== undefined && ok ? u : null;
}

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

export function createSession(res, user) {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + HOURS * 3600e3 })).toString('base64url');
  const token = payload + '.' + sign(payload);
  const secure = process.env.LOCAL_DEV ? '' : '; Secure';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${HOURS * 3600}${secure}`);
}

export function clearSession(res) {
  const secure = process.env.LOCAL_DEV ? '' : '; Secure';
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export function currentUser(req) {
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map(c => {
    const i = c.indexOf('=');
    return [c.slice(0, i).trim(), c.slice(i + 1).trim()];
  }));
  const token = cookies[COOKIE];
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    if (!users().has(data.u)) return null; // administrateur retiré entre-temps
    return data.u;
  } catch { return null; }
}

// Toutes les routes protégées passent par ici
export function guard(req, res, { write = false } = {}) {
  const user = currentUser(req);
  if (!user) { res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' }); return null; }
  if (write && req.headers['x-sdbs-admin'] !== '1') { res.status(403).json({ error: 'Requête refusée.' }); return null; }
  return user;
}
