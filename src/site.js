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
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
    });
  }
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
