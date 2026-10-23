// Moteur de rendu du site SDBS.
// Utilisé à la fois par build.js (génération de index.html sur Vercel)
// et par /admin (aperçu en direct). Ne dépend d'aucune API Node ni navigateur.

const ICONS = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  book: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>',
  megaphone: '<path d="m3 11 15-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h8M8 18h5"/>',
  ball: '<circle cx="12" cy="12" r="10"/><path d="M4.9 4.9a14 14 0 0 1 0 14.2M19.1 4.9a14 14 0 0 0 0 14.2M2 12h20M12 2v20"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  pen: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  coins: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  ledger: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9M13 13h4M13 17h4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  star: '<path d="m12 2 3 6.6 7 .7-5.3 4.8 1.6 7L12 17.5 5.7 21.1l1.6-7L2 9.3l7-.7z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  hands: '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  badge: '<circle cx="12" cy="9" r="6"/><path d="m9.5 9 1.7 1.7L14.8 7.3"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>'
};
export const ICON_NAMES = Object.keys(ICONS).filter(n => n !== 'phone' && n !== 'badge');
export function iconSvg(name) { return icon(name); }

const WA_PATH = 'M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z';

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Texte bilingue : {fr, en} ou simple chaîne. Si l'anglais est vide, on reprend le français.
function fr(v) { return v && typeof v === 'object' ? (v.fr || v.en || '') : (v || ''); }
function en(v) { return v && typeof v === 'object' ? (v.en || v.fr || '') : (v || ''); }
function has(v) { return !!(fr(v) || en(v)); }
function L(v, multiline) {
  const f = esc(fr(v)), e = esc(en(v));
  const nl = s => multiline ? s.replace(/\n/g, '<br>') : s;
  if (f === e) return nl(f);
  return `<span lang="fr">${nl(f)}</span><span lang="en">${nl(e)}</span>`;
}
function icon(name, extra = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${ICONS[name] || ICONS.star}</svg>`;
}
const STAR_FILLED = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS.star}</svg>`;
const WA_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
function safeUrl(u) {
  u = String(u || '').trim();
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('/') || u.startsWith('data:image/')) return esc(u);
  return '';
}
function img(src, alt, cls, extra = '') {
  const s = safeUrl(src);
  return s ? `<img class="${cls}" src="${s}" alt="${esc(alt)}" loading="lazy"${extra}>` : '';
}
function waHref(settings, msg) {
  return `https://wa.me/${esc(settings.whatsapp || '')}?text=${encodeURIComponent(fr(msg) || 'Bonjour SDBS, ')}`;
}
function waAttrs(msg) {
  return `class="js-wa" data-msg-fr="${esc(fr(msg))}" data-msg-en="${esc(en(msg))}"`;
}
// Zeffy : un lien Zeffy s'ouvre dans une fenêtre sur le site (formulaire intégré, dans la langue du visiteur).
// Tout autre lien s'ouvre normalement dans un nouvel onglet.
export function isZeffy(u) { return /^https:\/\/(www\.)?zeffy\.com\//i.test(String(u || '').trim()); }
function smartLink(url, cls, inner, title) {
  const u = safeUrl(url);
  if (!u) return '';
  const z = isZeffy(url) ? ` data-zeffy="${u}" data-zeffy-fr="${esc(fr(title))}" data-zeffy-en="${esc(en(title))}"` : '';
  return `<a class="${cls}" href="${u}" target="_blank" rel="noopener"${z}>${inner}</a>`;
}
const HEART_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>'}</svg>`;
const CARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>`;

function head(sec) {
  return `<div class="head">
      ${has(sec.overline) ? `<div class="overline">${L(sec.overline)}</div>` : ''}
      <h2>${L(sec.title)}</h2>
      ${has(sec.intro) ? `<p>${L(sec.intro, true)}</p>` : ''}
    </div>`;
}

// ---------- sections ----------
const R = {};

R.hero = (s, c) => {
  const def = !s.image || s.image === '/assets/logo/sdbs-logo.webp';
  const pic = def ? '/assets/logo/sdbs-pastille.webp' : s.image;
  return `
<div class="hero" id="accueil">
  <svg class="hero-star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.6 7 .7-5.3 4.8 1.6 7L12 17.5 5.7 21.1l1.6-7L2 9.3l7-.7z"/></svg>
  <div class="wrap">
    <div>
      ${has(s.overline) ? `<div class="overline">${L(s.overline)}</div>` : ''}
      <h1>${L(s.title)}</h1>
      ${has(s.lead) ? `<p class="lead">${L(s.lead, true)}</p>` : ''}
      <div class="cta">
        ${has(s.button1) ? `<a class="btn btn-gold" href="#adhesion">${L(s.button1)}</a>` : ''}
        ${has(s.button2) ? `<a class="btn btn-line" href="#contact">${L(s.button2)}</a>` : ''}
      </div>
      ${s.motto ? `<div class="motto">${esc(s.motto).split(' · ').join('<span class="d">·</span>')}</div>` : ''}
    </div>
    <div class="hero-visual${def ? ' is-seal' : ' is-photo'}">${img(pic, 'Senegalese Diaspora of BC Society', 'logo', ' width="420" height="420" loading="eager" fetchpriority="high"')}</div>
  </div>
  <div class="tri hero-tri" aria-hidden="true"><i></i><i></i><i></i></div>
</div>`;
};

R.about = (s) => `
<section class="alt" id="a-propos">
  <div class="wrap about">
    <div class="txt">
      ${has(s.overline) ? `<div class="overline">${L(s.overline)}</div>` : ''}
      <h2 class="h2">${L(s.title)}</h2>
      ${(s.paragraphs || []).filter(has).map(p => `<p>${L(p, true)}</p>`).join('\n      ')}
      ${(s.values || []).length ? `<ul class="values">
        ${s.values.map(v => `<li>${STAR_FILLED}<div><b>${L(v.title)}</b><span>${L(v.text)}</span></div></li>`).join('\n        ')}
      </ul>` : ''}
    </div>
    ${(s.facts || []).length ? `<div class="card">
      <h3>${L(s.factsTitle)}</h3>
      <div class="tri short" aria-hidden="true"><i></i><i></i><i></i></div>
      <ul class="facts">
        ${s.facts.map(f => `<li><span class="k">${L(f.label)}</span><span class="v">${L(f.value)}</span></li>`).join('\n        ')}
      </ul>
    </div>` : ''}
  </div>
</section>`;

R.mission = (s) => `
<section id="mission">
  <div class="wrap">
    ${head(s)}
    <div class="grid g2">
      ${(s.cards || []).map(c => `<div class="card">
        <h3><span class="ico">${icon(c.icon)}</span>${L(c.title)}</h3>
        <p>${L(c.text, true)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`;

R.board = (s) => {
  const vp = s.vicePresidents || [];
  const person = (p, pres) => `<div class="person${pres ? ' pres' : ''}"><span class="badge">${pres ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS.star}</svg>` : icon('badge')}</span><div class="role">${L(p.role)}</div><div class="pname">${esc(p.name)}</div></div>`;
  return `
<section class="bureau" id="bureau">
  <svg class="star-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".12" aria-hidden="true">${ICONS.star}</svg>
  <div class="wrap">
    <div class="head">
      ${has(s.overline) ? `<div class="overline">${L(s.overline)}</div>` : ''}
      <h2><span lang="fr">${esc(fr(s.title))} <em>${esc(fr(s.titleHighlight))}</em></span><span lang="en">${esc(en(s.title))} <em>${esc(en(s.titleHighlight))}</em></span></h2>
      ${has(s.intro) ? `<p>${L(s.intro, true)}</p>` : ''}
    </div>
    ${s.president && s.president.name ? `<div class="exec">
      ${vp[0] ? person(vp[0]) : '<div></div>'}
      ${person(s.president, true)}
      ${vp[1] ? person(vp[1]) : '<div></div>'}
    </div>` : ''}
    ${(s.offices || []).length ? `<div class="offices">
      ${s.offices.map(o => `<div class="office">
        <h3>${L(o.title)}</h3>
        ${(o.members || []).map(m => `<div class="orow"><span class="oi">${icon(m.icon)}</span><div><small>${L(m.role)}</small><b>${esc(m.name)}</b></div></div>`).join('\n        ')}
      </div>`).join('\n      ')}
    </div>` : ''}
    ${(s.committees || []).length ? `<div class="comm-title">${L(s.committeesTitle)}</div>
    <div class="comms">
      ${s.committees.map(c => `<article class="comm"><span class="ci">${icon(c.icon)}</span><small>${L(c.name)}</small><b>${esc(c.leader)}</b>${has(c.note) ? `<p>${L(c.note)}</p>` : ''}</article>`).join('\n      ')}
    </div>` : ''}
    ${has(s.footnote) ? `<p class="foot">${L(s.footnote)}</p>` : ''}
  </div>
</section>`;
};

R.activities = (s) => `
<section class="alt" id="activites">
  <div class="wrap">
    ${head(s)}
    <div class="grid g3">
      ${(s.items || []).map(a => `<div class="card${a.image ? ' has-img' : ''}">
        ${img(a.image, fr(a.title), 'card-img')}
        <h3>${L(a.title)}</h3>
        <p>${L(a.text, true)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`;

R.gallery = (s) => {
  const photos = (s.photos || []).filter(p => p.image);
  if (!photos.length) return '';
  return `
<section id="photos">
  <div class="wrap">
    ${head(s)}
    <div class="gallery">
      ${photos.map(p => `<figure>${img(p.image, fr(p.caption) || 'Photo SDBS', '')}${has(p.caption) ? `<figcaption>${L(p.caption)}</figcaption>` : ''}</figure>`).join('\n      ')}
    </div>
  </div>
</section>`;
};

R.events = (s, c) => `
<section id="evenements">
  <div class="wrap">
    ${head(s)}
    <div class="events" id="events-list">
      ${(s.items || []).filter(e => e.date).sort((a, b) => a.date < b.date ? -1 : 1).map(e => {
        const d = new Date(e.date + 'T12:00:00');
        const mf = d.toLocaleDateString('fr-CA', { month: 'short' }).replace('.', '');
        const me = d.toLocaleDateString('en-CA', { month: 'short' }).replace('.', '');
        const ff = d.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const fe = d.toLocaleDateString('en-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return `<article class="event${e.image ? ' has-img' : ''}" data-date="${esc(e.date)}">
        ${img(e.image, fr(e.title), 'event-img')}
        <div class="edate"><b>${d.getDate()}</b><small>${L({ fr: mf, en: me })}</small></div>
        <div>
          <h3>${L(e.title)}</h3>
          <div class="meta">${L({ fr: ff, en: fe })}${e.time ? ' · ' + esc(e.time) : ''}${has(e.place) ? '<br>' + L(e.place) : ''}</div>
          ${has(e.details) ? `<p>${L(e.details, true)}</p>` : ''}
          ${smartLink(e.link, 'elink', `${L(has(e.linkLabel) ? e.linkLabel : { fr: 'Billets et inscription', en: 'Tickets and registration' })} →`, e.title)}
        </div>
      </article>`;
      }).join('\n      ')}
      <div class="empty" id="events-empty"${(s.items || []).length ? ' hidden' : ''}>
        <p><b>${L(s.emptyTitle)}</b>${L(s.emptyText)}</p>
        <a class="btn btn-primary js-wa" data-msg-fr="Bonjour SDBS, je souhaite recevoir les nouvelles de vos événements." data-msg-en="Hello SDBS, I would like to receive news about your events." href="${waHref(c.settings, 'Bonjour SDBS, je souhaite recevoir les nouvelles de vos événements.')}" target="_blank" rel="noopener">${L(s.emptyButton)}</a>
      </div>
    </div>
  </div>
</section>`;

R.involved = (s, c) => {
  const arrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  return `
<section class="alt" id="adhesion">
  <div class="wrap">
    <div class="band">
      <div>
        ${has(s.overline) ? `<div class="overline">${L(s.overline)}</div>` : ''}
        <h2>${L(s.title)}</h2>
        ${has(s.text) ? `<p>${L(s.text, true)}</p>` : ''}
        ${(s.bullets || []).length ? `<ul>
          ${s.bullets.filter(has).map(b => `<li>${STAR_FILLED}${L(b)}</li>`).join('\n          ')}
        </ul>` : ''}
      </div>
      <div class="cta">
        ${smartLink(s.membershipUrl, 'btn btn-gold', CARD_ICON + L(has(s.membershipLabel) ? s.membershipLabel : { fr: 'Payer ma cotisation en ligne', en: 'Pay my membership online' }), has(s.membershipLabel) ? s.membershipLabel : { fr: 'Adhésion', en: 'Membership' })}
        ${smartLink(s.donationUrl, 'btn ' + (safeUrl(s.membershipUrl) ? 'btn-line' : 'btn-gold'), HEART_ICON + L(has(s.donationLabel) ? s.donationLabel : { fr: 'Faire un don', en: 'Make a donation' }), has(s.donationLabel) ? s.donationLabel : { fr: 'Faire un don', en: 'Make a donation' })}
        <a class="btn ${safeUrl(s.membershipUrl) || safeUrl(s.donationUrl) ? 'btn-line' : 'btn-gold'} js-wa" href="${waHref(c.settings, '')}" target="_blank" rel="noopener">${WA_ICON}${L(s.button)}</a>
      </div>
    </div>
    ${(s.ways || []).length ? `<div class="ways">
      ${s.ways.map((w, i) => `<div class="way"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${L(w.title)}</h3><p>${L(w.text, true)}</p>
        ${safeUrl(w.url) ? smartLink(w.url, '', L(w.link) + arrow, w.title) : `<a ${waAttrs(w.message)} href="${waHref(c.settings, w.message)}" target="_blank" rel="noopener">${L(w.link)}${arrow}</a>`}</div>`).join('\n      ')}
    </div>` : ''}
  </div>
</section>`;
};

R.contact = (s, c) => {
  const st = c.settings;
  const digits = String(st.phone || '').replace(/\D/g, '');
  const telOk = digits.length >= 7;
  const tel = 'tel:+1' + digits.replace(/^1(?=\d{10}$)/, '');
  const PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  return `
<section id="contact">
  <div class="wrap">
    ${head(s)}
    <div class="contact${s.showMap && st.address ? '' : ' nomap'}">
      <div class="card">
        ${st.contactName ? `<div class="cline"><span class="ico">${PERSON}</span>
          <div><small>${L({ fr: 'Personne à contacter', en: 'Contact person' })}</small><strong>${esc(st.contactName)}</strong></div></div>` : ''}
        ${telOk ? `<div class="cline"><span class="ico">${icon('phone')}</span>
          <div><small>${st.whatsapp ? L({ fr: 'Téléphone et WhatsApp', en: 'Phone and WhatsApp' }) : L({ fr: 'Téléphone', en: 'Phone' })}</small><a href="${esc(tel)}">${esc(st.phone)}</a></div></div>` : ''}
        ${st.email ? `<div class="cline"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg></span>
          <div><small>${L({ fr: 'Courriel', en: 'Email' })}</small><a href="mailto:${esc(st.email)}">${esc(st.email)}</a></div></div>` : ''}
        ${st.address ? `<div class="cline"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
          <div><small>${L({ fr: 'Siège enregistré', en: 'Registered office' })}</small><strong>${esc(st.address)}</strong></div></div>` : ''}
        <div class="cbtns">
          ${st.email ? `<a class="btn btn-primary" href="mailto:${esc(st.email)}">${L({ fr: 'Écrire un courriel', en: 'Send an email' })}</a>` : ''}
          ${st.whatsapp ? `<a class="btn ${st.email ? 'btn-ghost' : 'btn-primary'} js-wa" href="${waHref(st, '')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          ${telOk ? `<a class="btn btn-ghost" href="${esc(tel)}">${L({ fr: 'Appeler', en: 'Call' })}</a>` : ''}
        </div>
      </div>
      ${s.showMap && st.address ? `<div class="map">
        <iframe title="${esc(st.address)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(st.address)}&z=14&output=embed"></iframe>
      </div>` : ''}
    </div>
  </div>
</section>`;
};

const ANCHORS = { about: 'a-propos', mission: 'mission', board: 'bureau', activities: 'activites', gallery: 'photos', events: 'evenements', involved: 'adhesion', contact: 'contact' };
export const SECTION_IDS = ['hero', 'about', 'mission', 'board', 'activities', 'gallery', 'events', 'involved', 'contact'];

function isShown(id, c) {
  const s = c.sections[id];
  if (!s || s.visible === false) return false;
  if (id === 'gallery' && !(s.photos || []).some(p => p.image)) return false;
  return true;
}

export function renderPage(c, opts = {}) {
  const st = c.settings || {};
  const order = (c.order || SECTION_IDS).filter(id => R[id]);
  const shown = order.filter(id => isShown(id, c));
  const navItems = shown.filter(id => id !== 'hero' && c.sections[id].nav)
    .map(id => `<a href="#${ANCHORS[id]}">${L(c.sections[id].nav)}</a>`);
  const url = (st.siteUrl || '').replace(/\/$/, '');
  const ld = {
    '@context': 'https://schema.org', '@type': 'NGO', name: 'Senegalese Diaspora of BC Society', alternateName: 'SDBS',
    foundingDate: '2024-10-26', slogan: 'United · Supportive · Committed', url: url + '/'
  };
  if (st.phone) ld.telephone = st.phone;
  if (st.email) ld.email = st.email;

  return `<!doctype html>
<html lang="fr" data-lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(st.seoTitle || 'SDBS')}</title>
<meta name="description" content="${esc(fr(st.seoDescription))}">
<meta name="theme-color" content="#0B3D2E">
${opts.preview ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}/">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="SDBS">
<meta property="og:title" content="Senegalese Diaspora of BC Society (SDBS)">
<meta property="og:description" content="${esc(fr(st.seoDescription))}">
<meta property="og:url" content="${esc(url)}/">
<meta property="og:image" content="${esc(url)}/assets/logo/sdbs-logo-og.png">
<meta property="og:locale" content="fr_CA">
<meta property="og:locale:alternate" content="en_CA">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="/assets/logo/favicon.png">
<link rel="apple-touch-icon" href="/assets/logo/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css${opts.version ? '?v=' + esc(opts.version) : ''}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body data-wa="${esc(st.whatsapp || '')}">
<a class="skip" href="#top">${L({ fr: 'Aller au contenu', en: 'Skip to content' })}</a>
<div class="tri" aria-hidden="true"><i></i><i></i><i></i></div>

<header>
  <div class="wrap bar">
    <a class="brand" href="#top" aria-label="SDBS">
      <img src="/assets/logo/sdbs-symbole.webp" alt="" width="44" height="44">
      <b>SDBS</b>
    </a>
    <nav class="main" id="nav" aria-label="Menu">
      ${navItems.join('\n      ')}
      <div class="nav-cta">
        ${isShown('involved', c) && has(st.joinButton) ? `<a class="btn btn-gold" href="#adhesion">${L(st.joinButton)}</a>` : ''}
        ${st.whatsapp ? `<a class="btn btn-line js-wa" href="${waHref(st, '')}" target="_blank" rel="noopener">${WA_ICON}WhatsApp</a>` : (st.email ? `<a class="btn btn-line" href="mailto:${esc(st.email)}">${esc(st.email)}</a>` : '')}
      </div>
    </nav>
    ${isShown('involved', c) && has(st.joinButton) ? `<a class="btn btn-primary btn-sm join" href="#adhesion">${L(st.joinButton)}</a>` : ''}
    <div class="lang" role="group" aria-label="Langue / Language">
      <button type="button" data-set-lang="fr" aria-pressed="true">FR</button>
      <button type="button" data-set-lang="en" aria-pressed="false">EN</button>
    </div>
    <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</header>

<main id="top">
${shown.map(id => R[id](c.sections[id], c)).join('\n')}
</main>

<footer>
  <div class="tri" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap">
    <div>
      <b>Senegalese Diaspora of BC Society</b>
      <div class="motto">UNITED<span class="d">·</span>SUPPORTIVE<span class="d">·</span>COMMITTED</div>
      ${has(c.footer && c.footer.legal) ? `<small>${L(c.footer.legal)}</small>` : ''}
    </div>
    <nav class="fnav" aria-label="Footer">
      ${navItems.join('')}
    </nav>
    <div class="row">
      <span>© <span id="year">${new Date().getFullYear()}</span> Senegalese Diaspora of BC Society</span>
      <a class="totop" href="#top">${L({ fr: 'Haut de page', en: 'Back to top' })} ↑</a>
    </div>
  </div>
</footer>

${st.whatsapp ? `<a class="wa js-wa" href="${waHref(st, '')}" target="_blank" rel="noopener" aria-label="WhatsApp">${WA_ICON}</a>` : ''}
<nav class="mbar" aria-label="Actions rapides">
  ${isShown('involved', c) && has(st.joinButton) ? `<a class="mb-join" href="#adhesion">${L(st.joinButton)}</a>` : ''}
  ${st.whatsapp ? `<a class="mb-alt js-wa" href="${waHref(st, '')}" target="_blank" rel="noopener">${WA_ICON}<span>WhatsApp</span></a>`
    : st.email ? `<a class="mb-alt" href="mailto:${esc(st.email)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg><span>${L({ fr: 'Écrire', en: 'Email' })}</span></a>` : ''}
</nav>
<dialog class="zmodal" id="zeffy-modal" aria-labelledby="zeffy-title">
  <div class="zbar"><b id="zeffy-title"></b><button type="button" class="zclose" id="zeffy-close" aria-label="${esc('Fermer / Close')}">×</button></div>
  <div class="zbody"><iframe id="zeffy-frame" title="Zeffy" allow="payment" allowtransparency="true"></iframe></div>
  <p class="zfoot">${L({ fr: 'Paiement sécurisé par Zeffy, sans frais pour l’association.', en: 'Secure payment by Zeffy, at no cost to the society.' })} <a id="zeffy-new" href="#" target="_blank" rel="noopener">${L({ fr: 'Ouvrir dans un nouvel onglet', en: 'Open in a new tab' })}</a></p>
</dialog>
<script src="/assets/site.js${opts.version ? '?v=' + esc(opts.version) : ''}"></script>
</body>
</html>
`;
}
