import { renderPage, ICON_NAMES, iconSvg } from './render.js';

/* =========================================================
   Back-office SDBS
   Tout le contenu du site vit dans un seul objet (content/site.json).
   Chaque partie du site est décrite ci-dessous par une liste de champs :
   le formulaire est construit automatiquement à partir de cette description.
   ========================================================= */

// ---------- helpers ----------
const $ = s => document.querySelector(s);
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
const svg = d => h('span', { html: `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`, style: 'display:contents' });
const UI = {
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  chev: '<path d="m9 18 6-6-6-6"/>', image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
};
const clone = o => JSON.parse(JSON.stringify(o));
const bi = (fr = '', en = '') => ({ fr, en });

// ---------- état ----------
let content = null;      // brouillon en cours
let published = '';      // dernière version publiée (texte JSON)
let sha = null;
let me = { user: '', rawBase: '' };
let current = location.hash.slice(1) || 'hero';
const imgCache = {};     // chemin -> aperçu local (data URL) pour les photos pas encore en ligne
const openItems = new WeakSet();
const DRAFT_KEY = 'sdbs-admin-draft';

// ---------- description des formulaires ----------
const IMG_HINT = 'Format paysage conseillé. Les photos sont réduites automatiquement.';
const SCHEMA = [
  { group: 'Le site' },
  {
    id: 'hero', label: 'Accueil (haut de page)', icon: 'home', section: true,
    help: 'Le premier bloc que les visiteurs voient en arrivant sur le site.',
    fields: [
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'text', label: 'Titre principal' },
      { k: 'lead', t: 'bil', label: 'Texte de présentation' },
      { k: 'button1', t: 'bi', label: 'Bouton vert (mène à « S’impliquer »)' },
      { k: 'button2', t: 'bi', label: 'Bouton blanc (mène à « Contact »)' },
      { k: 'motto', t: 'text', label: 'Devise' },
      { k: 'image', t: 'image', label: 'Image à droite du titre', hint: 'Par défaut : le logo officiel de la SDBS.', defaultValue: '/assets/logo/sdbs-logo.webp', defaultLabel: 'Remettre le logo' }
    ]
  },
  {
    id: 'about', label: 'À propos', icon: 'users', section: true,
    help: 'Présentation de l’association, ses valeurs et l’encadré « En bref ».',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'paragraphs', t: 'list', label: 'Paragraphes', item: 'paragraphe', add: 'un paragraphe', summary: p => p.fr, make: () => bi(), fields: [{ k: null, t: 'bil', label: 'Texte du paragraphe' }] },
      { k: 'values', t: 'list', label: 'Valeurs (avec une étoile)', item: 'valeur', add: 'une valeur', summary: v => v.title.fr, make: () => ({ title: bi(), text: bi() }), fields: [
        { k: 'title', t: 'bi', label: 'Valeur' }, { k: 'text', t: 'bi', label: 'Explication' }] },
      { k: 'factsTitle', t: 'bi', label: 'Titre de l’encadré' },
      { k: 'facts', t: 'list', label: 'Lignes de l’encadré « En bref »', item: 'ligne', add: 'une ligne', summary: f => `${f.label.fr} : ${f.value.fr}`, make: () => ({ label: bi(), value: bi() }), fields: [
        { k: 'label', t: 'bi', label: 'Intitulé (à gauche)' }, { k: 'value', t: 'bi', label: 'Valeur (à droite)' }] }
    ]
  },
  {
    id: 'mission', label: 'Mission', icon: 'heart', section: true,
    help: 'Les grandes missions de l’association, présentées en cartes.',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'intro', t: 'bil', label: 'Phrase d’introduction' },
      { k: 'cards', t: 'list', label: 'Cartes', item: 'carte', add: 'une carte', summary: c => c.title.fr, make: () => ({ icon: 'star', title: bi(), text: bi() }), fields: [
        { k: 'icon', t: 'icon', label: 'Icône' }, { k: 'title', t: 'bi', label: 'Titre' }, { k: 'text', t: 'bil', label: 'Texte' }] }
    ]
  },
  {
    id: 'board', label: 'Bureau et commissions', icon: 'badge', section: true,
    help: 'Les membres élus du bureau et les responsables des commissions.',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre (en blanc)' },
      { k: 'titleHighlight', t: 'bi', label: 'Fin du titre (en jaune)' },
      { k: 'intro', t: 'bil', label: 'Texte d’introduction' },
      { k: 'president', t: 'group', label: 'Président(e)', fields: [
        { k: 'name', t: 'text', label: 'Nom' }, { k: 'role', t: 'bi', label: 'Titre' }] },
      { k: 'vicePresidents', t: 'list', label: 'Vice-présidents (2 au maximum, de part et d’autre du président)', max: 2, item: 'vice-président(e)', add: 'un(e) vice-président(e)', summary: p => `${p.name} · ${p.role.fr}`, make: () => ({ role: bi('Vice-président', 'Vice-president'), name: '' }), fields: [
        { k: 'name', t: 'text', label: 'Nom' }, { k: 'role', t: 'bi', label: 'Titre' }] },
      { k: 'offices', t: 'list', label: 'Secrétariat et trésorerie', item: 'bloc', add: 'un bloc', summary: o => o.title.fr, make: () => ({ title: bi(), members: [] }), fields: [
        { k: 'title', t: 'bi', label: 'Nom du bloc' },
        { k: 'members', t: 'list', label: 'Personnes', item: 'personne', add: 'une personne', summary: m => `${m.name} · ${m.role.fr}`, make: () => ({ icon: 'doc', role: bi(), name: '' }), fields: [
          { k: 'name', t: 'text', label: 'Nom' }, { k: 'role', t: 'bi', label: 'Fonction' }, { k: 'icon', t: 'icon', label: 'Icône' }] }] },
      { k: 'committeesTitle', t: 'bi', label: 'Titre de la liste des commissions' },
      { k: 'committees', t: 'list', label: 'Commissions', item: 'commission', add: 'une commission', summary: c => `${c.name.fr} · ${c.leader}`, make: () => ({ icon: 'star', name: bi(), leader: '', note: bi() }), fields: [
        { k: 'name', t: 'bi', label: 'Nom de la commission' }, { k: 'leader', t: 'text', label: 'Responsable' },
        { k: 'note', t: 'bi', label: 'Adjoint(e) ou autres membres', hint: 'Facultatif. Exemple : « Adjoint : Prénom Nom ».' },
        { k: 'icon', t: 'icon', label: 'Icône' }] },
      { k: 'footnote', t: 'bi', label: 'Phrase en bas du bloc' }
    ]
  },
  {
    id: 'activities', label: 'Activités', icon: 'star', section: true,
    help: 'Ce que fait l’association. Vous pouvez ajouter une photo à chaque activité.',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'items', t: 'list', label: 'Activités', item: 'activité', add: 'une activité', summary: a => a.title.fr, make: () => ({ image: '', title: bi(), text: bi() }), fields: [
        { k: 'title', t: 'bi', label: 'Nom de l’activité' }, { k: 'text', t: 'bil', label: 'Description' },
        { k: 'image', t: 'image', label: 'Photo (facultatif)', hint: IMG_HINT }] }
    ]
  },
  {
    id: 'gallery', label: 'Photos', icon: 'camera', section: true,
    help: 'Une galerie de photos de la communauté. La section n’apparaît sur le site que s’il y a au moins une photo. Demandez toujours l’accord des personnes photographiées (et des parents pour les enfants).',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'intro', t: 'bil', label: 'Phrase d’introduction (facultatif)' },
      { k: 'photos', t: 'list', bulkImages: true, label: 'Photos', item: 'photo', add: 'une photo', summary: p => p.caption.fr || 'Photo sans légende', make: () => ({ image: '', caption: bi() }), fields: [
        { k: 'image', t: 'image', label: 'Photo' }, { k: 'caption', t: 'bi', label: 'Légende (facultatif)' }] }
    ]
  },
  {
    id: 'events', label: 'Événements', icon: 'calendar', section: true,
    help: 'Annoncez vos prochains événements. Ils disparaissent automatiquement du site le lendemain de leur date.',
    fields: [
      { k: 'items', t: 'list', label: 'Événements', item: 'événement', add: 'un événement', summary: e => `${e.date ? new Date(e.date + 'T12:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sans date'} · ${e.title.fr || 'Sans titre'}`,
        make: () => ({ date: '', time: '', title: bi(), place: bi(), details: bi(), image: '' }), fields: [
          { k: 'title', t: 'bi', label: 'Nom de l’événement' },
          { k: 'date', t: 'date', label: 'Date', half: true }, { k: 'time', t: 'time', label: 'Heure (facultatif)', half: true },
          { k: 'place', t: 'bi', label: 'Lieu', hint: 'Adresse ou « En ligne ».' },
          { k: 'details', t: 'bil', label: 'Détails (facultatif)' },
          { k: 'image', t: 'image', label: 'Affiche ou photo (facultatif)', hint: IMG_HINT },
          { k: 'link', t: 'text', label: 'Lien de billetterie ou d’inscription (facultatif)', hint: 'Un lien Zeffy (billetterie) s’ouvre dans une fenêtre sur le site ; tout autre lien s’ouvre dans un nouvel onglet.', type: 'url' },
          { k: 'linkLabel', t: 'bi', label: 'Texte du lien', hint: 'Si vide : « Billets et inscription ».' }] },
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'intro', t: 'bil', label: 'Phrase d’introduction' },
      { k: 'emptyTitle', t: 'bi', label: 'Message quand il n’y a aucun événement : titre' },
      { k: 'emptyText', t: 'bil', label: 'Message quand il n’y a aucun événement : texte' },
      { k: 'emptyButton', t: 'bi', label: 'Message quand il n’y a aucun événement : bouton' }
    ]
  },
  {
    id: 'involved', label: 'S’impliquer / Adhésion', icon: 'hands', section: true,
    help: 'Le bloc vert « Rejoignez la SDBS » et les trois façons de s’impliquer.',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'text', t: 'bil', label: 'Texte' },
      { k: 'bullets', t: 'list', label: 'Conditions (avec une étoile)', item: 'condition', add: 'une condition', summary: b => b.fr, make: () => bi(), fields: [{ k: null, t: 'bi', label: 'Condition' }] },
      { k: 'membershipUrl', t: 'text', label: 'Paiement de la cotisation en ligne (lien Zeffy)', hint: 'Collez le lien de partage de votre formulaire Zeffy (il commence par https://www.zeffy.com/). Il s’ouvrira dans une fenêtre sur le site, en français ou en anglais selon le visiteur. Laissez vide pour cacher le bouton.', type: 'url' },
      { k: 'membershipLabel', t: 'bi', label: 'Texte du bouton de cotisation', hint: 'Si vide : « Payer ma cotisation en ligne ».' },
      { k: 'donationUrl', t: 'text', label: 'Dons en ligne (lien Zeffy)', hint: 'Collez le lien de partage de votre formulaire Zeffy (il commence par https://www.zeffy.com/). Il s’ouvrira dans une fenêtre sur le site, en français ou en anglais selon le visiteur. Laissez vide pour cacher le bouton.', type: 'url' },
      { k: 'donationLabel', t: 'bi', label: 'Texte du bouton de don', hint: 'Si vide : « Faire un don ».' },
      { k: 'button', t: 'bi', label: 'Texte du bouton WhatsApp' },
      { k: 'ways', t: 'list', label: 'Façons de s’impliquer (cartes)', item: 'carte', add: 'une carte', summary: w => w.title.fr, make: () => ({ title: bi(), text: bi(), link: bi(), message: bi() }), fields: [
        { k: 'title', t: 'bi', label: 'Titre' }, { k: 'text', t: 'bil', label: 'Texte' }, { k: 'link', t: 'bi', label: 'Texte du lien' },
        { k: 'message', t: 'bi', label: 'Message WhatsApp pré-rempli', hint: 'Le message qui s’écrit tout seul quand le visiteur clique.' },
        { k: 'url', t: 'text', label: 'Ou un lien (Zeffy ou autre site)', hint: 'Facultatif. S’il est rempli, le lien remplace WhatsApp. Un lien Zeffy s’ouvre dans une fenêtre sur le site.', type: 'url' }] }
    ]
  },
  {
    id: 'contact', label: 'Contact', icon: 'chat', section: true,
    help: 'Le téléphone, WhatsApp, le courriel et l’adresse se modifient dans « Coordonnées et réglages ».',
    fields: [
      { k: 'nav', t: 'bi', label: 'Nom dans le menu', hint: 'Un ou deux mots seulement (exemple : « Contact »). Ce n’est pas l’endroit pour un courriel ou un numéro.' },
      { k: 'overline', t: 'bi', label: 'Petit texte au-dessus du titre' },
      { k: 'title', t: 'bi', label: 'Titre' },
      { k: 'intro', t: 'bil', label: 'Phrase d’introduction' },
      { k: 'showMap', t: 'toggle', label: 'Afficher la carte Google Maps' }
    ]
  },
  { group: 'Général' },
  {
    id: 'settings', label: 'Coordonnées et réglages', icon: 'gear', obj: c => c.settings,
    help: 'Les informations utilisées partout sur le site.',
    fields: [
      { k: 'siteUrl', t: 'text', label: 'Adresse du site', hint: 'Exemple : https://sdbs.netlify.app (utilisée par Google et pour les partages).', type: 'url' },
      { k: 'contactName', t: 'text', label: 'Personne à contacter (facultatif)', hint: 'Exemple : Emile Nioke, président. Le nom va ici, pas dans le téléphone.' },
      { k: 'phone', t: 'text', label: 'Téléphone affiché', hint: 'Uniquement un numéro. Exemple : (672) 558-3698. Laissez vide pour ne pas afficher de téléphone.' },
      { k: 'whatsapp', t: 'text', label: 'Numéro WhatsApp', hint: 'Indicatif du pays puis numéro, chiffres uniquement. Exemple : 16725583698', digits: true },
      { k: 'email', t: 'text', label: 'Courriel', hint: 'Laissez vide pour ne pas afficher de courriel.', type: 'email' },
      { k: 'address', t: 'text', label: 'Adresse du siège' },
      { k: 'joinButton', t: 'bi', label: 'Bouton vert du menu' },
      { k: 'seoTitle', t: 'text', label: 'Titre de l’onglet du navigateur et de Google' },
      { k: 'seoDescription', t: 'bil', label: 'Description pour Google et les partages', hint: 'Une ou deux phrases.' },
      { k: 'legal', t: 'bil', label: 'Mention en bas de page', obj: c => c.footer }
    ]
  },
  { id: 'order', label: 'Ordre et affichage', icon: 'layers', special: 'order', help: 'Choisissez l’ordre des parties du site et celles qui sont affichées.' }
];
const PANELS = SCHEMA.filter(s => s.id);
const LABEL = Object.fromEntries(PANELS.map(p => [p.id, p.label]));

// ---------- API ----------
async function api(path, opts = {}) {
  const r = await fetch('/api/' + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'X-SDBS-Admin': '1' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin'
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== 'login' && path !== 'me') {
    showLogin('Votre session a expiré. Reconnectez-vous : vos modifications sont gardées.');
    throw new Error('401');
  }
  if (!r.ok) throw new Error(data.error || 'Erreur ' + r.status);
  return data;
}

// ---------- connexion ----------
function showLogin(msg) {
  $('#app').hidden = true;
  $('#login').hidden = false;
  const err = $('#lg-error');
  err.hidden = !msg; err.textContent = msg || '';
  setTimeout(() => $('#lg-user').focus(), 50);
}
$('#lg-show').addEventListener('click', () => {
  const p = $('#lg-pass'); const show = p.type === 'password';
  p.type = show ? 'text' : 'password'; $('#lg-show').textContent = show ? 'Masquer' : 'Afficher';
});
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#lg-submit'); btn.disabled = true; btn.textContent = 'Connexion…';
  try {
    await api('login', { method: 'POST', body: { username: $('#lg-user').value, password: $('#lg-pass').value } });
    $('#lg-pass').value = '';
    await start();
  } catch (err) {
    const el = $('#lg-error'); el.hidden = false; el.textContent = err.message;
  } finally { btn.disabled = false; btn.textContent = 'Se connecter'; }
});

async function start() {
  try { me = await api('me'); } catch { return showLogin(); }
  $('#who').textContent = me.user;
  let data;
  try { data = await api('content'); } catch (e) { if (e.message !== '401') fatal(e.message); return; }
  content = data.content; sha = data.sha;
  normalize(content);
  published = JSON.stringify(content);
  $('#login').hidden = true; $('#app').hidden = false;
  buildSide(); show(PANELS.some(p => p.id === current) ? current : 'hero');
  updateStatus();
  await maybeRestoreDraft();
}
function fatal(msg) {
  $('#login').hidden = true; $('#app').hidden = false;
  $('#panel').replaceChildren(h('div', { class: 'box' }, h('h2', {}, 'Le back-office n’est pas encore prêt'), h('p', { class: 'muted' }, msg)));
}

// S'assure que toutes les sections et listes existent (si le fichier est ancien ou incomplet)
function normalize(c) {
  c.settings ||= {}; c.footer ||= { legal: bi() }; c.sections ||= {};
  c.order ||= ['hero', 'about', 'mission', 'board', 'activities', 'gallery', 'events', 'involved', 'contact'];
  for (const p of PANELS.filter(p => p.section)) {
    c.sections[p.id] ||= { visible: true };
    if (!c.order.includes(p.id)) c.order.push(p.id);
    fill(c.sections[p.id], p.fields);
  }
  fill(c.settings, PANELS.find(p => p.id === 'settings').fields.filter(f => !f.obj));
  function fill(obj, fields) {
    for (const f of fields) {
      if (f.k == null) continue;
      if (f.t === 'list') { if (!Array.isArray(obj[f.k])) obj[f.k] = []; obj[f.k].forEach(it => it && typeof it === 'object' && fill(it, f.fields)); }
      else if (f.t === 'bi' || f.t === 'bil') { if (!obj[f.k] || typeof obj[f.k] !== 'object') obj[f.k] = bi(obj[f.k] || ''); }
      else if (f.t === 'group') { obj[f.k] ||= {}; fill(obj[f.k], f.fields); }
      else if (obj[f.k] == null) obj[f.k] = f.t === 'toggle' ? false : '';
    }
  }
}

// ---------- brouillon automatique ----------
let draftTimer;
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try {
      if (isDirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ sha, at: Date.now(), content }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, 400);
}
async function maybeRestoreDraft() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch {}
  if (!d || !d.content) return;
  if (JSON.stringify(d.content) === published) { localStorage.removeItem(DRAFT_KEY); return; }
  const when = new Date(d.at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' });
  if (d.sha !== sha) {
    await ask('Anciennes modifications', [`Vous aviez des modifications non publiées (${when}), mais le site a été mis à jour depuis par un autre administrateur.`, 'Elles ne peuvent pas être reprises automatiquement.'], 'Compris', null);
    localStorage.removeItem(DRAFT_KEY); return;
  }
  if (await ask('Reprendre vos modifications ?', [`Vous avez des modifications non publiées du ${when}.`], 'Les reprendre', 'Les effacer')) {
    content = d.content; normalize(content); show(current); updateStatus();
  } else localStorage.removeItem(DRAFT_KEY);
}

// ---------- état / statut ----------
const isDirty = () => content && JSON.stringify(content) !== published;
function changed() { updateStatus(); saveDraft(); }
function updateStatus() {
  const d = isDirty();
  const st = $('#status');
  st.textContent = d ? 'Modifications non publiées' : 'Tout est publié';
  st.classList.toggle('dirty', d);
  $('#btn-publish').disabled = !d;
  buildSideBadges();
}
window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

// ---------- navigation ----------
function buildSide() {
  const side = $('#side'); side.replaceChildren();
  const sel = $('#side-select'); sel.replaceChildren();
  let og = null;
  for (const s of SCHEMA) {
    if (s.group) { side.append(h('div', { class: 'group' }, s.group)); og = h('optgroup', { label: s.group }); sel.append(og); continue; }
    side.append(h('button', { type: 'button', 'data-id': s.id, onclick: () => show(s.id) },
      h('span', { html: s.icon in UI ? `<svg viewBox="0 0 24 24" aria-hidden="true">${UI[s.icon]}</svg>` : iconSvg(s.icon), style: 'display:contents' }),
      h('span', {}, s.label), h('span', { class: 'off', hidden: true }, 'masquée')));
    og.append(h('option', { value: s.id }, s.label));
  }
  sel.onchange = () => show(sel.value);
}
function buildSideBadges() {
  document.querySelectorAll('#side button[data-id]').forEach(b => {
    const s = content && content.sections[b.dataset.id];
    b.querySelector('.off').hidden = !(s && s.visible === false);
  });
}
function show(id) {
  current = id;
  history.replaceState(null, '', '#' + id);
  document.querySelectorAll('#side button[data-id]').forEach(b => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'));
  $('#side-select').value = id;
  renderPanel();
  window.scrollTo({ top: 0 });
}

// ---------- panneau ----------
function renderPanel() {
  const p = PANELS.find(x => x.id === current);
  const panel = $('#panel');
  const y = window.scrollY;
  panel.replaceChildren(h('div', { class: 'panel-head' }, h('h1', {}, p.label), p.help ? h('p', {}, p.help) : null));
  if (p.special === 'order') { panel.append(orderPanel()); return; }
  const obj = p.section ? content.sections[p.id] : p.obj(content);
  if (p.section) panel.append(visibilityBox(p.id));
  const box = h('div', { class: 'box' });
  appendFields(box, p.fields, f => field(f.obj ? f.obj(content) : obj, f));
  panel.append(box);
  window.scrollTo({ top: y });
}

function visibilityBox(id) {
  const s = content.sections[id];
  const input = h('input', { type: 'checkbox', checked: s.visible !== false, onchange: e => { s.visible = e.target.checked; changed(); renderPanel(); } });
  const note = id === 'gallery' && !(s.photos || []).some(x => x.image) ? 'Ajoutez au moins une photo pour que cette section apparaisse.' : (s.visible === false ? 'Cette section est cachée : les visiteurs ne la voient pas.' : 'Les visiteurs voient cette section.');
  return h('div', { class: 'box visibility' },
    h('label', { class: 'toggle' }, input, h('span', { class: 'sw' }), 'Afficher cette section sur le site'),
    h('span', { class: 'note' }, note));
}

function orderPanel() {
  const wrap = h('div', { class: 'order' });
  const ids = content.order;
  ids.forEach((id, i) => {
    const s = content.sections[id];
    if (!s) return;
    const move = d => { const j = i + d; [ids[i], ids[j]] = [ids[j], ids[i]]; changed(); renderPanel(); };
    wrap.append(h('div', { class: 'order-row' },
      h('label', { class: 'toggle', title: 'Afficher ou cacher' }, h('input', { type: 'checkbox', checked: s.visible !== false, 'aria-label': 'Afficher ' + LABEL[id], onchange: e => { s.visible = e.target.checked; changed(); renderPanel(); } }), h('span', { class: 'sw' })),
      h('b', {}, LABEL[id] || id),
      h('div', { class: 'arrows' },
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Monter', disabled: i === 0, onclick: () => move(-1) }, svg(UI.up)),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Descendre', disabled: i === ids.length - 1, onclick: () => move(1) }, svg(UI.down)))));
  });
  return h('div', { class: 'box' }, h('p', { class: 'hint muted' }, 'L’interrupteur affiche ou cache la partie. Les flèches changent sa place sur la page.'), wrap);
}

// ---------- champs ----------
function field(obj, f, onAny) {
  const notify = () => { changed(); onAny && onAny(); };
  const wrap = h('div', { class: 'field' });
  const id = 'f' + Math.random().toString(36).slice(2, 9);
  const label = f.t === 'toggle' ? null : h(['bi', 'bil', 'list', 'icon', 'image', 'group'].includes(f.t) ? 'div' : 'label', { class: 'label', for: id }, f.label);
  if (label) wrap.append(label);
  if (f.hint) wrap.append(h('p', { class: 'hint' }, f.hint));
  const get = () => f.k == null ? obj : obj[f.k];

  switch (f.t) {
    case 'text': case 'date': case 'time': {
      const input = h('input', { id, type: f.t === 'text' ? (f.type || 'text') : f.t, value: get() || '' });
      input.addEventListener('input', () => {
        let v = input.value;
        if (f.digits) { v = v.replace(/\D/g, ''); if (v !== input.value) input.value = v; }
        obj[f.k] = v; notify();
      });
      wrap.append(input); break;
    }
    case 'bi': case 'bil': {
      let v = get();
      if (!v || typeof v !== 'object') { v = bi(v || ''); if (f.k != null) obj[f.k] = v; }
      const mk = lang => {
        const el = f.t === 'bil' ? h('textarea', { rows: 3, 'aria-label': `${f.label} (${lang === 'fr' ? 'français' : 'anglais'})`, placeholder: lang === 'en' ? 'English (si vide : texte français)' : '' }) : h('input', { type: 'text', 'aria-label': `${f.label} (${lang === 'fr' ? 'français' : 'anglais'})`, placeholder: lang === 'en' ? 'English (si vide : texte français)' : '' });
        el.value = v[lang] || '';
        el.addEventListener('input', () => { v[lang] = el.value; if (el.tagName === 'TEXTAREA') grow(el); notify(); });
        if (el.tagName === 'TEXTAREA') requestAnimationFrame(() => grow(el));
        return h('div', { class: 'lang-in ' + lang }, h('span', { class: 'tag' }, lang.toUpperCase()), el);
      };
      wrap.append(h('div', { class: 'bi' }, mk('fr'), mk('en')));
      break;
    }
    case 'toggle': {
      const input = h('input', { type: 'checkbox', checked: !!get(), onchange: e => { obj[f.k] = e.target.checked; notify(); } });
      wrap.append(h('label', { class: 'toggle' }, input, h('span', { class: 'sw' }), f.label));
      break;
    }
    case 'icon': {
      const row = h('div', { class: 'icons', role: 'group', 'aria-label': f.label });
      const paint = () => row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.icon === obj[f.k] ? 'true' : 'false'));
      for (const name of ICON_NAMES) row.append(h('button', { type: 'button', 'data-icon': name, title: name, html: iconSvg(name), onclick: () => { obj[f.k] = name; paint(); notify(); } }));
      paint(); wrap.append(row); break;
    }
    case 'image': wrap.append(imageField(obj, f, notify)); break;
    case 'group': {
      const inner = h('div', { class: 'item-body', style: 'border:1.5px solid var(--line);border-radius:12px' });
      obj[f.k] ||= {};
      for (const sub of f.fields) inner.append(field(obj[f.k], sub, onAny));
      wrap.append(inner); break;
    }
    case 'list': wrap.append(listField(obj, f, onAny)); break;
  }
  return wrap;
}
// Place côte à côte les champs marqués « half » (ex. date et heure)
function appendFields(container, fields, make) {
  let row = null;
  for (const f of fields) {
    const el = make(f);
    if (f.half) {
      if (!row) { row = h('div', { class: 'row2 field' }); container.append(row); }
      el.style.marginTop = '0'; row.append(el);
    } else { row = null; container.append(el); }
  }
}
function grow(t) { t.style.height = 'auto'; t.style.height = Math.max(90, t.scrollHeight + 4) + 'px'; }

function listField(obj, f, onAny) {
  const arr = obj[f.k] ||= [];
  const box = h('div', { class: 'list' });
  const rerender = () => renderPanel();
  if (!arr.length) box.append(h('div', { class: 'empty-list' }, `Rien pour le moment. Cliquez sur « Ajouter ${f.add || f.item} ».`));
  arr.forEach((it, i) => {
    const sumText = () => { try { return (f.summary && f.summary(it)) || '' ; } catch { return ''; } };
    const sum = h('span', { class: 'sum' }, sumText() || `${cap(f.item)} ${i + 1}`);
    const refresh = () => { sum.textContent = sumText() || `${cap(f.item)} ${i + 1}`; onAny && onAny(); };
    const det = h('details', { class: 'item' });
    if (openItems.has(it)) det.open = true;
    det.addEventListener('toggle', () => det.open ? openItems.add(it) : openItems.delete(it));
    const body = h('div', { class: 'item-body' });
    // k null = l'élément de la liste est lui-même le texte (ex. liste de paragraphes)
    appendFields(body, f.fields, sub => field(sub.k == null ? arr : it, sub.k == null ? { ...sub, k: i } : sub, refresh));
    const move = d => { const j = i + d; [arr[i], arr[j]] = [arr[j], arr[i]]; changed(); rerender(); };
    body.append(h('div', { class: 'item-tools' },
      h('button', { type: 'button', class: 'btn small', disabled: i === 0, onclick: () => move(-1) }, svg(UI.up), 'Monter'),
      h('button', { type: 'button', class: 'btn small', disabled: i === arr.length - 1, onclick: () => move(1) }, svg(UI.down), 'Descendre'),
      h('button', { type: 'button', class: 'btn small danger', style: 'margin-left:auto', onclick: async () => {
        if (await ask('Supprimer ?', [`Supprimer « ${sumText() || f.item} » ?`, 'Vous pourrez encore annuler tant que vous n’avez pas publié.'], 'Supprimer', 'Garder')) {
          arr.splice(i, 1); changed(); rerender();
        }
      } }, svg(UI.trash), 'Supprimer')));
    det.append(h('summary', {}, h('span', { class: 'num' }, String(i + 1)), sum, h('span', { class: 'chev', html: `<svg viewBox="0 0 24 24">${UI.chev}</svg>` })), body);
    box.append(det);
  });
  const canAdd = !f.max || arr.length < f.max;
  const tools = h('div', {});
  if (canAdd && !f.bulkImages) tools.append(h('button', { type: 'button', class: 'btn add', onclick: () => {
    const it = f.make(); arr.push(it); if (typeof it === 'object') openItems.add(it); changed(); rerender();
  } }, svg(UI.plus), `Ajouter ${f.add || f.item}`));
  if (f.bulkImages) {
    const input = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    const status = h('span', { class: 'busy', hidden: true });
    input.addEventListener('change', async () => {
      const files = [...input.files]; input.value = '';
      for (let n = 0; n < files.length; n++) {
        status.hidden = false; status.replaceChildren(h('span', { class: 'spin' }), `Envoi de la photo ${n + 1} sur ${files.length}…`);
        try { const path = await uploadImage(files[n]); arr.push({ image: path, caption: bi() }); changed(); }
        catch (e) { toast(e.message, true); }
      }
      status.hidden = true; rerender();
    });
    tools.append(h('div', { style: 'display:flex;gap:12px;align-items:center;margin-top:10px;flex-wrap:wrap' },
      h('button', { type: 'button', class: 'btn primary', onclick: () => input.click() }, svg(UI.camera), 'Ajouter des photos depuis mon appareil'), status, input));
  }
  return h('div', {}, box, tools);
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- images ----------
function displayUrl(p) {
  if (!p) return '';
  if (imgCache[p]) return imgCache[p];
  if (p.startsWith('/assets/uploads/') && me.rawBase) return me.rawBase + p;
  return p;
}
function imageField(obj, f, notify) {
  const thumb = h('div', { class: 'thumb' });
  const actions = h('div', { class: 'img-actions' });
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  const status = h('span', { class: 'busy', hidden: true }, h('span', { class: 'spin' }), 'Envoi de la photo…');
  const paint = () => {
    const v = obj[f.k];
    thumb.classList.toggle('has', !!v);
    thumb.style.backgroundImage = v ? `url("${displayUrl(v)}")` : '';
    thumb.replaceChildren(v ? '' : h('span', {}, 'Aucune photo'));
    actions.replaceChildren(...[
      h('button', { type: 'button', class: 'btn small', onclick: () => input.click() }, svg(UI.image), v ? 'Changer la photo' : 'Choisir une photo'),
      v && f.defaultValue && v !== f.defaultValue ? h('button', { type: 'button', class: 'btn small', onclick: () => { obj[f.k] = f.defaultValue; paint(); notify(); } }, f.defaultLabel || 'Valeur par défaut') : null,
      v && !f.defaultValue ? h('button', { type: 'button', class: 'btn small danger', onclick: () => { obj[f.k] = ''; paint(); notify(); } }, 'Retirer') : null,
      status, input].filter(Boolean));
  };
  const handle = async file => {
    if (!file) return;
    status.hidden = false;
    try { obj[f.k] = await uploadImage(file); paint(); notify(); toast('Photo ajoutée. N’oubliez pas de publier.'); }
    catch (e) { toast(e.message, true); }
    finally { status.hidden = true; }
  };
  input.addEventListener('change', () => { handle(input.files[0]); input.value = ''; });
  thumb.addEventListener('click', () => input.click());
  thumb.addEventListener('dragover', e => { e.preventDefault(); thumb.classList.add('drag'); });
  thumb.addEventListener('dragleave', () => thumb.classList.remove('drag'));
  thumb.addEventListener('drop', e => { e.preventDefault(); thumb.classList.remove('drag'); handle(e.dataTransfer.files[0]); });
  paint();
  return h('div', { class: 'img-field' }, thumb, actions);
}

async function uploadImage(file) {
  if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error('Ce fichier n’est pas une photo.');
  let bmp;
  try { bmp = await createImageBitmap(file); }
  catch { throw new Error('Format de photo non reconnu. Utilisez une photo JPG ou PNG.'); }
  const MAX = 1800;
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), hgt = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = hgt;
  const ctx = canvas.getContext('2d');
  const keepPng = file.type === 'image/png' && file.size < 1.2e6;
  if (!keepPng) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hgt); }
  ctx.drawImage(bmp, 0, 0, w, hgt);
  const type = keepPng ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(type, 0.85);
  const data = dataUrl.split(',')[1];
  if (data.length > 4.2e6) throw new Error('Cette photo est trop lourde.');
  const res = await api('upload', { method: 'POST', body: { name: file.name, type, data } });
  imgCache[res.path] = dataUrl;
  return res.path;
}

// ---------- aperçu ----------
function previewContent() {
  const c = clone(content);
  (function walk(o) {
    for (const k in o) {
      if (typeof o[k] === 'string' && o[k].startsWith('/assets/uploads/')) o[k] = displayUrl(o[k]);
      else if (o[k] && typeof o[k] === 'object') walk(o[k]);
    }
  })(c);
  return c;
}
let previewLang = 'fr';
function openPreview() {
  const frame = $('#preview-frame');
  frame.srcdoc = renderPage(previewContent(), { preview: true }).replace('<html lang="fr" data-lang="fr">', `<html lang="${previewLang}" data-lang="${previewLang}">`)
    .replace('</head>', `<script>try{localStorage.setItem('sdbs-lang','${previewLang}')}catch(e){}</script></head>`);
  $('#preview').hidden = false;
  document.body.style.overflow = 'hidden';
}
$('#btn-preview').addEventListener('click', openPreview);
$('#preview-close').addEventListener('click', () => { $('#preview').hidden = true; document.body.style.overflow = ''; });
document.querySelectorAll('#preview [data-w]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#preview [data-w]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  $('#preview-frame').style.width = b.dataset.w;
}));
document.querySelectorAll('#preview [data-lang]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#preview [data-lang]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  previewLang = b.dataset.lang; openPreview();
}));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#preview').hidden) $('#preview-close').click(); });

// ---------- publier / annuler ----------
$('#btn-publish').addEventListener('click', async () => {
  const problems = [];
  (content.sections.events.items || []).forEach((e, i) => { if (!e.date) problems.push(`L’événement n° ${i + 1} n’a pas de date.`); });
  for (const p of PANELS.filter(p => p.section)) {
    const nav = content.sections[p.id] && content.sections[p.id].nav;
    for (const l of ['fr', 'en']) {
      const v = nav && nav[l] || '';
      if (v.includes('@') || /\d{6,}/.test(v.replace(/\D/g, '')) || v.length > 22) { problems.push(`« ${p.label} » : le nom dans le menu (« ${v} ») doit être un mot court. Mettez le courriel ou le téléphone dans « Coordonnées et réglages ».`); break; }
    }
  }
  if (content.settings.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(content.settings.email)) problems.push('Le courriel ne semble pas valide.');
  if (content.settings.phone && content.settings.phone.replace(/\D/g, '').length < 7) problems.push('Le téléphone doit être un numéro (exemple : (672) 558-3698). Pour un nom, utilisez « Personne à contacter ».');
  if (content.settings.whatsapp && !/^\d{8,15}$/.test(content.settings.whatsapp)) problems.push('Le numéro WhatsApp doit contenir uniquement des chiffres, avec l’indicatif du pays.');
  if (problems.length) return ask('Avant de publier', problems, 'Compris', null);
  if (!await ask('Publier les modifications ?', ['Vos modifications seront visibles par tout le monde sur le site d’ici une à deux minutes.'], 'Publier', 'Pas encore')) return;
  const btn = $('#btn-publish'); btn.disabled = true; btn.querySelector('span').textContent = 'Publication…';
  try {
    const r = await api('content', { method: 'PUT', body: { content, sha } });
    sha = r.sha; published = JSON.stringify(content);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    toast('C’est publié ! Le site sera à jour d’ici une à deux minutes.');
  } catch (e) {
    if (e.message !== '401') ask('La publication n’a pas fonctionné', [e.message], 'Compris', null);
  } finally {
    btn.querySelector('span').textContent = 'Publier';
    updateStatus();
  }
});
$('#btn-discard').addEventListener('click', async () => {
  $('.menu').open = false;
  if (!isDirty()) return toast('Il n’y a aucune modification à annuler.');
  if (!await ask('Annuler mes modifications ?', ['Toutes les modifications non publiées seront effacées et le formulaire reviendra à la version actuellement en ligne.'], 'Tout annuler', 'Garder')) return;
  content = JSON.parse(published); normalize(content);
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  renderPanel(); updateStatus(); toast('Modifications annulées.');
});
$('#btn-logout').addEventListener('click', async () => {
  $('.menu').open = false;
  if (isDirty() && !await ask('Se déconnecter ?', ['Vous avez des modifications non publiées. Elles restent gardées sur cet appareil et vous seront proposées à la prochaine connexion.'], 'Se déconnecter', 'Rester')) return;
  try { await api('logout', { method: 'POST' }); } catch {}
  location.reload();
});
$('#btn-help').addEventListener('click', () => {
  $('.menu').open = false;
  ask('Comment ça marche ?', [h('ol', { class: 'help-list' },
    h('li', {}, 'Choisissez à gauche la partie du site à modifier.'),
    h('li', {}, 'Modifiez les textes. Le français est à gauche, l’anglais à droite. Si l’anglais est vide, le texte français s’affiche.'),
    h('li', {}, 'Ajoutez des photos avec « Choisir une photo ».'),
    h('li', {}, 'Cliquez sur « Aperçu » pour voir le résultat.'),
    h('li', {}, 'Cliquez sur « Publier » : le site est mis à jour en une à deux minutes.'),
    h('li', {}, 'Vos modifications sont gardées automatiquement sur cet appareil tant que vous n’avez pas publié.'))], 'Compris', null);
});

// ---------- dialogue & toast ----------
function ask(title, lines, okLabel = 'OK', cancelLabel = 'Annuler') {
  const dlg = $('#dialog');
  $('#dlg-title').textContent = title;
  $('#dlg-body').replaceChildren(...lines.map(l => typeof l === 'string' ? h('p', {}, l) : l));
  $('#dlg-ok').textContent = okLabel;
  const cancel = $('#dlg-cancel');
  cancel.hidden = !cancelLabel; if (cancelLabel) cancel.textContent = cancelLabel;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(res => dlg.addEventListener('close', () => res(dlg.returnValue === 'ok'), { once: true }));
}
let toastTimer;
function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('err', !!err); t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, err ? 6000 : 4000);
}

start();
