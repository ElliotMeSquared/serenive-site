/* Serenive Beauty & Spa — site behaviour: header state, mobile menu, gentle reveals, forms. */
(function () {
  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: transparent over the opening forest band, ivory once the page scrolls past it. */
  var opener = document.querySelector('.hero, .page-hero');
  function updateHeader() {
    if (!header) return;
    var limit = opener ? opener.offsetHeight - header.offsetHeight - 20 : 0;
    header.classList.toggle('is-solid', window.scrollY > Math.max(limit, 40) || !opener);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);

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

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
