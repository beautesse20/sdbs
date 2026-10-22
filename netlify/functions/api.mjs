// Adaptateur Netlify : réutilise tels quels les fichiers du dossier api/ (écrits au format Vercel).
import login from '../../api/login.js';
import logout from '../../api/logout.js';
import me from '../../api/me.js';
import content from '../../api/content.js';
import upload from '../../api/upload.js';

const ROUTES = { login, logout, me, content, upload };

export default async (request, context) => {
  const name = new URL(request.url).pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
  const handler = ROUTES[name];
  if (!handler) return new Response(JSON.stringify({ error: 'Introuvable' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  const headers = Object.fromEntries(request.headers); // clés en minuscules
  if (!headers['x-forwarded-for'] && context && context.ip) headers['x-forwarded-for'] = context.ip;
  let body = {};
  if (!['GET', 'HEAD'].includes(request.method)) {
    try { body = await request.json(); } catch { body = {}; }
  }
  const req = { method: request.method, headers, body, url: request.url };

  let status = 200, payload = '';
  const out = new Headers({ 'Cache-Control': 'no-store' });
  const res = {
    setHeader(k, v) { out.set(k, v); return res; },
    status(c) { status = c; return res; },
    json(o) { out.set('Content-Type', 'application/json'); payload = JSON.stringify(o); return res; },
    end(s) { payload = s || ''; return res; }
  };
  await handler(req, res);
  return new Response(payload, { status, headers: out });
};

export const config = {
  path: ['/api/login', '/api/logout', '/api/me', '/api/content', '/api/upload']
};
