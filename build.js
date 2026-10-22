// Génère le site dans /public à partir de content/site.json (exécuté par Vercel à chaque mise à jour).
import fs from 'node:fs';
import path from 'node:path';
import { renderPage } from './src/render.js';

const OUT = 'public';
const version = (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 8);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dst, { recursive: true, filter: f => !path.basename(f).startsWith('.') });
}

copyDir('assets', path.join(OUT, 'assets'));
fs.copyFileSync('src/site.css', path.join(OUT, 'assets/site.css'));
fs.copyFileSync('src/site.js', path.join(OUT, 'assets/site.js'));
copyDir('admin', path.join(OUT, 'admin'));
fs.copyFileSync('src/render.js', path.join(OUT, 'admin/render.js'));

const content = JSON.parse(fs.readFileSync('content/site.json', 'utf8'));
fs.writeFileSync(path.join(OUT, 'index.html'), renderPage(content, { version }));
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /admin\n');

console.log('Site généré dans /public (version ' + version + ')');
