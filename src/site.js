(function () {
  var root = document.documentElement;
  var wa = document.body.getAttribute('data-wa') || '';
  var defMsg = { fr: 'Bonjour SDBS, ', en: 'Hello SDBS, ' };
  function setLang(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === l ? 'true' : 'false');
    });
    document.querySelectorAll('.js-wa').forEach(function (a) {
      var msg = a.getAttribute('data-msg-' + l) || defMsg[l];
      a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
    });
    try { localStorage.setItem('sdbs-lang', l); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('sdbs-lang'); } catch (e) {}
  var q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  var start = q || saved || ((navigator.language || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr');
  setLang(start === 'en' ? 'en' : 'fr');
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang')); });
  });

  // Hide past events; show the empty message when nothing is left
  var list = document.getElementById('events-list');
  if (list) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var left = 0;
    list.querySelectorAll('.event[data-date]').forEach(function (ev) {
      var d = new Date(ev.getAttribute('data-date') + 'T23:59:00');
      if (d < today) ev.hidden = true; else left++;
    });
    var empty = document.getElementById('events-empty');
    if (empty) empty.hidden = left > 0;
  }

  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  if (btn && nav) {
    var ICON_OPEN = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    var ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open ? ICON_CLOSE : ICON_OPEN;
    };
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }
  // Zeffy : ouvrir le formulaire dans une fenêtre, dans la langue du visiteur
  var zm = document.getElementById('zeffy-modal');
  function zeffyEmbed(url, lang) {
    try {
      var u = new URL(url);
      var parts = u.pathname.split('/').filter(Boolean)
        .filter(function (p) { return !/^(fr|en)(-(ca|us))?$/i.test(p) && p.toLowerCase() !== 'embed'; });
      return 'https://www.zeffy.com/' + (lang === 'en' ? 'en-ca' : 'fr-ca') + '/embed/' + parts.join('/');
    } catch (e) { return url; }
  }
  if (zm && typeof zm.showModal === 'function') {
    var frame = document.getElementById('zeffy-frame');
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-zeffy]');
      if (!a) return;
      e.preventDefault();
      var lang = root.getAttribute('data-lang') || 'fr';
      var src = a.getAttribute('data-zeffy');
      frame.src = zeffyEmbed(src, lang);
      document.getElementById('zeffy-new').href = src;
      document.getElementById('zeffy-title').textContent = a.getAttribute('data-zeffy-' + lang) || 'Zeffy';
      zm.showModal();
    });
    var closeZ = function () { zm.close(); };
    document.getElementById('zeffy-close').addEventListener('click', closeZ);
    zm.addEventListener('click', function (e) { if (e.target === zm) closeZ(); });
    zm.addEventListener('close', function () { frame.src = 'about:blank'; });
  }

  // Téléphone : petits points sous chaque groupe de cartes qui défilent
  document.querySelectorAll('#mission .grid, #activites .grid, .comms, .ways').forEach(function (track) {
    var cards = Array.prototype.filter.call(track.children, function (c) { return !c.hidden; });
    if (cards.length < 2) return;
    var nav = document.createElement('div');
    nav.className = 'slide-nav';
    nav.setAttribute('aria-hidden', 'true');
    var dots = document.createElement('div');
    dots.className = 'slide-dots';
    cards.forEach(function () { dots.appendChild(document.createElement('i')); });
    var hint = document.createElement('span');
    hint.className = 'slide-hint';
    hint.innerHTML = '<span lang="fr">Faites glisser →</span><span lang="en">Swipe →</span>';
    nav.appendChild(dots); nav.appendChild(hint);
    track.after(nav);
    var update = function () {
      var w = cards[0].getBoundingClientRect().width + 12;
      var i = Math.min(cards.length - 1, Math.round(track.scrollLeft / (w || 1)));
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === i); });
      hint.style.visibility = i === cards.length - 1 ? 'hidden' : 'visible';
    };
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    update();
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
