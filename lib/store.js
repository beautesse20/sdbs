// Lecture et écriture des contenus : sur GitHub en production, dans les fichiers locaux en mode test.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const LOCAL = Boolean(process.env.LOCAL_DEV); // mode test uniquement (jamais défini sur Vercel)
const REPO = process.env.GITHUB_REPO || 'beautesse20/sdbs';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const CONTENT_PATH = 'content/site.json';

export function configured() {
  return Boolean(process.env.GITHUB_TOKEN || LOCAL);
}
export function rawBase() {
  return LOCAL ? '' : `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
}

async function gh(method, url, body) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sdbs-admin'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.message || ('GitHub ' + r.status));
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function getContent() {
  if (LOCAL) {
    const text = fs.readFileSync(CONTENT_PATH, 'utf8');
    return { content: JSON.parse(text), sha: crypto.createHash('sha1').update(text).digest('hex') };
  }
  const data = await gh('GET', `contents/${CONTENT_PATH}?ref=${BRANCH}&t=${Date.now()}`);
  const text = Buffer.from(data.content, 'base64').toString('utf8');
  return { content: JSON.parse(text), sha: data.sha };
}

export async function saveContent(content, sha, user) {
  const text = JSON.stringify(content, null, 2) + '\n';
  if (LOCAL) {
    const cur = crypto.createHash('sha1').update(fs.readFileSync(CONTENT_PATH, 'utf8')).digest('hex');
    if (sha && cur !== sha) { const e = new Error('conflict'); e.status = 409; throw e; }
    fs.writeFileSync(CONTENT_PATH, text);
    return { sha: crypto.createHash('sha1').update(text).digest('hex') };
  }
  const data = await gh('PUT', `contents/${CONTENT_PATH}`, {
    message: `Mise à jour du site par ${user} (back-office)`,
    content: Buffer.from(text).toString('base64'),
    sha,
    branch: BRANCH
  });
  return { sha: data.content.sha };
}

export async function saveFile(relPath, base64, user) {
  if (LOCAL) {
    fs.mkdirSync(path.dirname(relPath), { recursive: true });
    fs.writeFileSync(relPath, Buffer.from(base64, 'base64'));
    return;
  }
  await gh('PUT', `contents/${relPath}`, {
    message: `Photo ajoutée par ${user} (back-office)`,
    content: base64,
    branch: BRANCH
  });
}
