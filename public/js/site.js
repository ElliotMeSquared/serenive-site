/* Serenive Beauty & Spa — site behaviour: header state, mobile menu, gentle reveals, forms. */
(function () {
  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Smooth scrolling for mouse and trackpad. Touch keeps native scrolling; off for reduced motion. */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: { offset: -80 }, autoRaf: true });
  }

  /* Header: transparent over the opening forest band, ivory once the page scrolls past it.
     The threshold is measured on load and resize only, so scrolling never forces a layout. */
  var opener = document.querySelector('.hero, .page-hero');
  var limit = 40, solid = null, queued = false;
  function measure() {
    limit = opener && header ? Math.max(opener.offsetHeight - header.offsetHeight - 20, 40) : 0;
  }
  function updateHeader() {
    queued = false;
    if (!header) return;
    var next = !opener || window.scrollY > limit;
    if (next !== solid) { solid = next; header.classList.toggle('is-solid', next); root.classList.toggle('past-hero', next); }
  }
  measure(); updateHeader();
  window.addEventListener('scroll', function () {
    if (!queued) { queued = true; requestAnimationFrame(updateHeader); }
  }, { passive: true });
  window.addEventListener('resize', function () { measure(); updateHeader(); });

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var sheet = document.getElementById('menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
    }
    if (sheet) sheet.inert = !open;
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  }
  if (toggle && sheet) {
    sheet.inert = true;
    toggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* Gentle reveal: only for blocks that start below the fold, so the first view is complete at rest. */
  var blocks = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('reveal-in');
        el.classList.remove('reveal-pending');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(function (el, i) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('reveal-pending');
        el.style.transitionDelay = (el.dataset.reveal ? Number(el.dataset.reveal) : 0) + 'ms';
        io.observe(el);
      }
    });
  }

  /* Forms: no back end is connected yet. Each form names its future endpoint in data-endpoint. */
  [].forEach.call(document.querySelectorAll('form[data-form]'), function (form) {
    var note = form.querySelector('.form-note');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        if (note) note.textContent = form.getAttribute('data-preview-message') || 'This form is not connected yet.';
        return;
      }
      fetch(endpoint, { method: 'POST', body: new FormData(form) })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          if (note) note.textContent = form.getAttribute('data-success') || 'Thank you.';
          form.reset();
        })
        .catch(function () {
          if (note) note.textContent = 'That didn’t go through. Please try again, or email us directly.';
        });
    });
  });

  /* Booking preview: choosing a treatment highlights it and enables the continue button. */
  var options = [].slice.call(document.querySelectorAll('.booking__option'));
  var next = document.getElementById('booking-continue');
  var chosen = document.getElementById('booking-chosen');
  options.forEach(function (btn) {
    btn.addEventListener('click', function () {
      options.forEach(function (o) { o.setAttribute('aria-pressed', String(o === btn)); });
      if (chosen) chosen.textContent = btn.dataset.name;
      if (next) next.removeAttribute('aria-disabled');
    });
  });
  if (next) next.addEventListener('click', function (e) {
    var url = next.getAttribute('data-square-url');
    if (url) { next.href = url; return; }
    e.preventDefault();
    var note = document.getElementById('booking-note');
    if (note) note.textContent = 'Preview only: choosing a time will open Serenive\u2019s Square booking here once the account is connected.';
  });
  var preselect = (location.hash || '').slice(1);
  options.forEach(function (o) { if (o.dataset.id === preselect) o.click(); });

  /* Manifesto: wrap each word so it can ink in as the statement scrolls through (CSS does the motion).
     The heading keeps its plain sentence as its accessible name. */
  [].forEach.call(document.querySelectorAll('[data-words]'), function (el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var spans = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = part;
            spans.push(s); frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.hasAttribute('aria-hidden')) {
          walk(child);
        }
      });
    })(el);
    spans.forEach(function (s, i) { s.style.setProperty('--p', (i / Math.max(spans.length - 1, 1)).toFixed(3)); });
  });

  /* Treatment index: the hovered or focused treatment takes the image stage. */
  var rows = [].slice.call(document.querySelectorAll('.tindex__row'));
  var shots = [].slice.call(document.querySelectorAll('.tindex__shot'));
  var captionNum = document.querySelector('.tindex__caption-num');
  var current = 0;
  function activate(i) {
    if (i === current) return;
    rows.forEach(function (r, k) { r.classList.toggle('is-active', k === i); });
    shots.forEach(function (s, k) {
      s.classList.toggle('was-active', k === current);
      s.classList.toggle('is-active', k === i);
    });
    if (captionNum) captionNum.textContent = (i < 9 ? '0' : '') + (i + 1);
    current = i;
  }
  if (rows.length) {
    rows[0].classList.add('is-active');
    rows.forEach(function (r, i) {
      r.addEventListener('mouseenter', function () { activate(i); });
      r.addEventListener('focus', function () { activate(i); });
    });
  }
  /* On phones the list is a swipe strip: the counter follows the card in view. */
  var strip = document.querySelector('.tindex__list');
  var count = document.querySelector('.tindex__count b');
  if (strip && count && 'IntersectionObserver' in window && window.matchMedia('(max-width: 900px)').matches) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var i = rows.indexOf(entry.target);
        if (i > -1) count.textContent = (i < 9 ? '0' : '') + (i + 1);
      });
    }, { root: strip, threshold: 0.6 });
    rows.forEach(function (r) { sio.observe(r); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
