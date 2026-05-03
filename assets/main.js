const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ── NAV SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  });
});

/* ── THEME TOGGLE ── */
const themeBtn = document.getElementById('theme-toggle');
const DARK_KEY = 'tl_theme';
const savedTheme = localStorage.getItem(DARK_KEY);
if (savedTheme === 'light') document.body.classList.remove('dark');
else document.body.classList.add('dark');
themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(DARK_KEY, isDark ? 'dark' : 'light');
});

/* ── CURSOR ── */
if (!REDUCED) {
  const dot = document.getElementById('c-dot');
  const ring = document.getElementById('c-ring');
  let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => gsap.to([dot,ring],{opacity:0,duration:.4}));
  document.addEventListener('mouseenter', () => gsap.to([dot,ring],{opacity:1,duration:.4}));
  document.querySelectorAll('a,button,.fbtn,.tfbtn,.exp-card,.proj-card,.lang-switch,.tour-btn').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-grow'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-grow'));
  });
  // lag factor: .09 = smooth lag like Linear
  gsap.ticker.add(() => {
    gsap.set(dot, { x: mx, y: my });
    rx += (mx - rx) * .09; ry += (my - ry) * .09;
    gsap.set(ring, { x: rx, y: ry });
  });
}

/* ── TYPEWRITER ── */
let _twTimer = null;
function restartTypewriter(words) {
  if (_twTimer) clearTimeout(_twTimer);
  const twEl = document.getElementById('tw-text');
  twEl.textContent = '';
  let wi = 0, ci = 0, deleting = false;
  function type() {
    const word = words[wi];
    if (!deleting) {
      twEl.textContent = word.slice(0, ci + 1); ci++;
      if (ci === word.length) { deleting = true; _twTimer = setTimeout(type, 1800); return; }
      _twTimer = setTimeout(type, 60);
    } else {
      twEl.textContent = word.slice(0, ci - 1); ci--;
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; _twTimer = setTimeout(type, 200); return; }
      _twTimer = setTimeout(type, 35);
    }
  }
  if (REDUCED) { twEl.textContent = words[0]; }
  else { _twTimer = setTimeout(type, 400); }
}
restartTypewriter(['Chef de Projet Digital', 'Product Owner', 'Analyste Fonctionnel']);

/* ── HERO ── */
if (!REDUCED) {
  gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .1 })
    .to('.hero-tag', { opacity: 1, y: 0, duration: .6 })
    .to('.hero-pitch', { opacity: .75, duration: .5 }, '-=.2')
    .from('.hero-title .line', { opacity: 0, y: 22, duration: .75, stagger: .13 }, '-=.2')
    .to('.hero-target', { opacity: 1, y: 0, duration: .5 }, '-=.3')
    .to('.hero-status', { opacity: 1, y: 0, duration: .45 }, '-=.25')
    .to('.hero-bottom', { opacity: 1, y: 0, duration: .55 }, '-=.25');
} else {
  gsap.set(['.hero-tag','.hero-title','.hero-status','.hero-bottom'], { opacity: 1 });
  gsap.set('.hero-target', { opacity: 1 });
  gsap.set('.hero-pitch', { opacity: .75 });
}

/* ── NAV SCROLL ── */
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 80,
  onEnter: () => nav.classList.add('scrolled'),
  onLeaveBack: () => nav.classList.remove('scrolled')
});

/* ── ACTIVE NAV ── */
const navLinks = document.querySelectorAll('.nav-links a');
document.querySelectorAll('section[id]').forEach(s =>
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) navLinks.forEach(a => {
        a.removeAttribute('aria-current');
        if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current','page');
      });
    });
  }, { threshold: .35 }).observe(s)
);

/* ── BURGER ── */
const burger = document.getElementById('burger');
const mobMenu = document.getElementById('mob-menu');
const bLines = burger.querySelectorAll('span');
let mOpen = false;
function toggleMenu() {
  mOpen = !mOpen;
  burger.setAttribute('aria-expanded', mOpen);
  mobMenu.setAttribute('aria-hidden', !mOpen);
  mobMenu.querySelectorAll('a, button').forEach(a => a.setAttribute('tabindex', mOpen ? '0' : '-1'));
  if (!REDUCED) {
    if (mOpen) {
      mobMenu.classList.add('open'); document.body.classList.add('menu-open');
      gsap.from(mobMenu.querySelectorAll('a'), { y: 28, opacity: 0, duration: .5, stagger: .08, ease: 'power3.out' });
      gsap.to(bLines[0], { rotation: 45, y: 6.5, duration: .3 });
      gsap.to(bLines[1], { opacity: 0, duration: .2 });
      gsap.to(bLines[2], { rotation: -45, y: -6.5, duration: .3 });
    } else {
      gsap.to(bLines[0], { rotation: 0, y: 0, duration: .3 });
      gsap.to(bLines[1], { opacity: 1, duration: .2 });
      gsap.to(bLines[2], { rotation: 0, y: 0, duration: .3, onComplete: () => { mobMenu.classList.remove('open'); document.body.classList.remove('menu-open'); }});
    }
  } else { mobMenu.classList.toggle('open', mOpen); document.body.classList.toggle('menu-open', mOpen); }
}
burger.addEventListener('click', toggleMenu);
mobMenu.querySelectorAll('a, button').forEach(a => a.addEventListener('click', () => { if (mOpen) toggleMenu(); }));

/* ── QUI SUIS-JE ── */
if (!REDUCED) {
  gsap.from('.qsj-accroche', { scrollTrigger: { trigger: '.qsj-accroche', start: 'top 82%' }, opacity: 0, y: 32, duration: .75, ease: 'power3.out' });
  gsap.from('.qsj-body', { scrollTrigger: { trigger: '.qsj-body', start: 'top 82%' }, opacity: 0, duration: .7, delay: .15, ease: 'power2.out' });
  gsap.from('.qsj-card', { scrollTrigger: { trigger: '.qsj-pillars', start: 'top 82%' }, opacity: 0, y: 36, duration: .6, stagger: .15, ease: 'power3.out' });
}

/* ── SCROLL TO TOP ── */
const scrollTopBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', () => {
  const show = window.scrollY > 400;
  scrollTopBtn.style.opacity = show ? '1' : '0';
  scrollTopBtn.style.pointerEvents = show ? 'auto' : 'none';
});
scrollTopBtn.addEventListener('click', () => {
  document.getElementById('accueil').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
});

/* ── EXPERTISE REVEAL ── */
if (!REDUCED) {
  gsap.from('.exp-card', { scrollTrigger: { trigger: '.exp-grid', start: 'top 82%' }, opacity: 0, y: 36, duration: .6, stagger: .11, ease: 'power3.out' });
}

/* ── TOOL LOGO WALL FILTER ── */
(function () {
  const btns  = document.querySelectorAll('.tfbtn');
  const tiles = document.querySelectorAll('.tool-tile');

  function filterWall(cat) {
    btns.forEach(b => {
      const active = b.dataset.cat === cat;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    tiles.forEach(tile => {
      const show = cat === 'all' || tile.dataset.cat === cat;
      if (show) {
        tile.style.display = 'flex';
        if (!REDUCED) gsap.fromTo(tile, { opacity: 0, scale: .88 }, { opacity: 1, scale: 1, duration: .28, ease: 'power2.out' });
        else gsap.set(tile, { opacity: 1, scale: 1 });
      } else {
        if (!REDUCED) {
          gsap.to(tile, { opacity: 0, scale: .88, duration: .18, ease: 'power2.in',
            onComplete() { tile.style.display = 'none'; }
          });
        } else { tile.style.display = 'none'; }
      }
    });
  }

  btns.forEach(btn => btn.addEventListener('click', () => filterWall(btn.dataset.cat)));

  /* Fallback pour les logos Simple Icons non disponibles */
  document.querySelectorAll('.si-icon').forEach(img => {
    img.addEventListener('error', function () {
      const name = this.closest('.tool-tile').querySelector('.tool-tile-name').textContent;
      const initials = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
      const fb = document.createElement('div');
      fb.className = 'tool-tile-fallback';
      fb.setAttribute('aria-hidden', 'true');
      fb.textContent = initials;
      this.replaceWith(fb);
    });
  });

  /* Animation d'entrée au scroll */
  if (!REDUCED) {
    gsap.from('.tool-tile', {
      scrollTrigger: { trigger: '#tool-wall', start: 'top 82%' },
      opacity: 0, scale: .85, duration: .4, stagger: .03, ease: 'power2.out'
    });
  }
})();

/* ── STAT COUNTERS ── */
document.querySelectorAll('.stat-n').forEach(el => {
  const target = parseInt(el.dataset.count, 10);
  const suf = el.dataset.suf || '';
  if (!REDUCED) {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: '.stats', start: 'top 82%' },
      onUpdate() { el.textContent = Math.round(obj.val) + suf; }
    });
  } else { el.textContent = target + suf; }
});

/* ── PARCOURS REVEAL ── */
if (!REDUCED) {
  gsap.from('.cv-col-head', { scrollTrigger: { trigger: '#parcours', start: 'top 78%' }, opacity: 0, y: 16, duration: .5, stagger: .15, ease: 'power3.out' });
  gsap.from('.cv-item', { scrollTrigger: { trigger: '#parcours', start: 'top 72%' }, opacity: 0, y: 22, duration: .5, stagger: .06, ease: 'power3.out' });
  gsap.from('.xp-card', { scrollTrigger: { trigger: '.xp-strip', start: 'top 82%' }, opacity: 0, y: 20, duration: .5, stagger: .1, ease: 'power3.out' });
}

/* ── PROJECTS REVEAL ── */
if (!REDUCED) {
  gsap.from('.proj-card', { scrollTrigger: { trigger: '.proj-grid', start: 'top 82%' }, opacity: 0, y: 45, duration: .7, stagger: .14, ease: 'power3.out' });
}

/* ── PROJECT FILTER ── */
document.querySelectorAll('.fbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.proj-card').forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.setAttribute('data-hidden', !show);
      if (!REDUCED && show) gsap.from(card, { opacity: 0, y: 18, duration: .4, ease: 'power2.out' });
    });
  });
});

/* ── CONTACT REVEAL ── */
if (!REDUCED) {
  gsap.from('.c-info', { scrollTrigger: { trigger: '#contact', start: 'top 80%' }, opacity: 0, x: -28, duration: .75, ease: 'power3.out' });
  gsap.from('.cform > *', { scrollTrigger: { trigger: '#contact', start: 'top 72%' }, opacity: 0, y: 18, duration: .5, stagger: .07, ease: 'power3.out' });
}

/* ── CAPTCHA ── */
let cA, cB;
function genCap() {
  cA = Math.floor(Math.random()*9)+1; cB = Math.floor(Math.random()*9)+1;
  document.getElementById('cap-a').textContent = cA;
  document.getElementById('cap-b').textContent = cB;
  document.getElementById('cap-in').value = '';
}
genCap();

/* ── FORM ── */
const cform = document.getElementById('cform');
const subBtn = document.getElementById('sub-btn');
function vf(id, ok) {
  const g = document.getElementById(id).closest('.fgrp');
  g.classList.toggle('bad', !ok); return ok;
}
cform.addEventListener('submit', e => {
  e.preventDefault();
  const nom   = document.getElementById('f-nom').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const obj   = document.getElementById('f-obj').value.trim();
  const msg   = document.getElementById('f-msg').value.trim();
  const ans   = parseInt(document.getElementById('cap-in').value, 10);
  const capErr = document.getElementById('cap-err');
  const v1 = vf('f-nom',   nom.length > 0);
  const v2 = vf('f-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const v3 = vf('f-obj',   obj.length > 0);
  const v4 = vf('f-msg',   msg.length > 0);
  const capOk = ans === cA + cB;
  capErr.style.display = capOk ? 'none' : 'block';
  if (!v1||!v2||!v3||!v4||!capOk) return;
  subBtn.classList.add('loading');
  subBtn.querySelector('span').textContent = window._i18n_t ? window._i18n_t('form_sending') : 'Envoi en cours…';
  setTimeout(() => {
    subBtn.classList.remove('loading');
    subBtn.querySelector('span').textContent = window._i18n_t ? window._i18n_t('form_submit') : 'Envoyer le message';
    cform.reset(); genCap();
    const ok = document.getElementById('form-ok');
    ok.classList.add('show');
    if (!REDUCED) gsap.from(ok, { opacity: 0, y: 8, duration: .4 });
    setTimeout(() => ok.classList.remove('show'), 5000);
  }, 1800);
});

/* ── COOKIES ── */
const CK_KEY = 'tl_consent';
const banner = document.getElementById('ck-banner');
if (!localStorage.getItem(CK_KEY)) setTimeout(() => banner.classList.add('vis'), 900);
else setTimeout(startTour, 1000);
document.getElementById('ck-accept').addEventListener('click', () => {
  localStorage.setItem(CK_KEY, JSON.stringify({f:true,a:true})); banner.classList.remove('vis'); setTimeout(startTour, 450);
});
document.getElementById('ck-refuse').addEventListener('click', () => {
  localStorage.setItem(CK_KEY, JSON.stringify({f:true,a:false})); banner.classList.remove('vis'); setTimeout(startTour, 450);
});
document.getElementById('ck-custom').addEventListener('click', () => {
  document.getElementById('ck-panel').classList.toggle('open');
});
let aOn = false;
const tglAn = document.getElementById('tgl-an');
tglAn.addEventListener('click', () => {
  aOn = !aOn; tglAn.classList.toggle('on',aOn); tglAn.setAttribute('aria-checked',aOn);
});
document.getElementById('ck-save').addEventListener('click', () => {
  localStorage.setItem(CK_KEY, JSON.stringify({f:true,a:aOn})); banner.classList.remove('vis'); setTimeout(startTour, 450);
});
document.getElementById('btn-ck').addEventListener('click', () => {
  localStorage.removeItem(CK_KEY); banner.classList.add('vis');
});

/* ── MICRO TOUR ── */
const TOUR_KEY = 'tl_micro_tour_seen_v1';
const tourLayer = document.getElementById('tour-layer');
const tourSpot  = document.getElementById('tour-spot');
const tourTitle = document.getElementById('tour-title');
const tourText  = document.getElementById('tour-text');
const tourStep  = document.getElementById('tour-step');
const tourNext  = document.getElementById('tour-next');
const tourSkip  = document.getElementById('tour-skip');
const tourSteps = [
  { target: '#lang-switch',  titleKey: 'tour_lang_title',  textKey: 'tour_lang_text',  nextKey: 'tour_lang_next' },
  { target: '#theme-toggle', titleKey: 'tour_theme_title', textKey: 'tour_theme_text', nextKey: 'tour_theme_next' }
];
let tourIndex = 0;

function visibleTourSteps() {
  return tourSteps.filter(step => {
    const el = document.querySelector(step.target);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = window.getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  });
}

function placeTour() {
  const steps = visibleTourSteps();
  if (!steps.length) return endTour(false);
  const step   = steps[Math.min(tourIndex, steps.length - 1)];
  const target = document.querySelector(step.target);
  const rect   = target.getBoundingClientRect();
  const pad    = 10;
  tourSpot.style.cssText = `left:${rect.left-pad}px;top:${rect.top-pad}px;width:${rect.width+pad*2}px;height:${rect.height+pad*2}px`;
  const t = window._i18n_t || (k => k);
  tourTitle.textContent = t(step.titleKey);
  tourText.textContent  = t(step.textKey);
  tourStep.textContent  = `${Math.min(tourIndex+1, steps.length)} / ${steps.length}`;
  tourNext.textContent  = t(step.nextKey);
  tourSkip.textContent  = t('tour_skip');
  const cardW = Math.min(330, window.innerWidth - 32);
  let left = Math.min(Math.max(rect.left, 16), window.innerWidth - cardW - 16);
  let top  = rect.bottom + 18;
  if (top + 190 > window.innerHeight) top = Math.max(16, rect.top - 210);
  document.getElementById('tour-card').style.cssText = `left:${left}px;top:${top}px`;
}

function startTour() {
  if (REDUCED || localStorage.getItem(TOUR_KEY)) return;
  const steps = visibleTourSteps();
  if (!steps.length) return;
  tourIndex = 0;
  tourLayer.classList.add('show');
  tourLayer.setAttribute('aria-hidden', 'false');
  placeTour();
}

function endTour(save = true) {
  if (save) localStorage.setItem(TOUR_KEY, '1');
  tourLayer.classList.remove('show');
  tourLayer.setAttribute('aria-hidden', 'true');
}

tourNext.addEventListener('click', () => {
  const steps = visibleTourSteps();
  if (tourIndex >= steps.length - 1) return endTour(true);
  tourIndex += 1;
  placeTour();
});
tourSkip.addEventListener('click', () => endTour(true));
window.addEventListener('resize', () => { if (tourLayer.classList.contains('show')) placeTour(); });
window.addEventListener('scroll', () => { if (tourLayer.classList.contains('show')) placeTour(); }, { passive: true });

/* ── COPYRIGHT YEAR ── */
document.getElementById('copy-year').textContent = new Date().getFullYear();

/* ── PRIVACY MODAL ── */
const priv = document.getElementById('priv');
document.getElementById('btn-priv').addEventListener('click', () => { priv.classList.add('open'); document.getElementById('priv-close').focus(); });
document.getElementById('priv-close').addEventListener('click', () => priv.classList.remove('open'));
priv.addEventListener('click', e => { if (e.target === priv) priv.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') priv.classList.remove('open'); });

/* ── I18N ── */
(function () {
  const LANG_KEY = 'tl_lang';
  const cache = {};
  let currentLang = localStorage.getItem(LANG_KEY) || 'fr';

  function t(key) { return (cache[currentLang] && cache[currentLang][key]) || key; }
  window._i18n_t = t;

  /* Allowlist sanitizer — seules les balises éditoriales sont autorisées */
  const ALLOWED_TAGS = new Set(['em', 'strong', 'br', 'span']);
  function sanitizeHtml(str) {
    const tmp = document.createElement('div');
    tmp.innerHTML = str;
    tmp.querySelectorAll('*').forEach(el => {
      if (!ALLOWED_TAGS.has(el.tagName.toLowerCase())) {
        el.replaceWith(document.createTextNode(el.textContent));
      } else {
        /* Supprimer tous les attributs sauf class */
        Array.from(el.attributes).forEach(attr => {
          if (attr.name !== 'class') el.removeAttribute(attr.name);
        });
      }
    });
    return tmp.innerHTML;
  }

  function applyTranslations(tr, lang) {
    document.documentElement.lang = lang;
    if (tr.meta_title) document.title = tr.meta_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && tr.meta_desc) metaDesc.content = tr.meta_desc;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = tr[el.dataset.i18n]; if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = tr[el.dataset.i18nHtml]; if (v !== undefined) el.innerHTML = sanitizeHtml(v);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const v = tr[el.dataset.i18nPh]; if (v !== undefined) el.placeholder = v;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const v = tr[el.dataset.i18nAria]; if (v !== undefined) el.setAttribute('aria-label', v);
    });
    document.querySelectorAll('.lang-btn, .lang-mob-btn').forEach(btn => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('active', active);
      if (btn.hasAttribute('aria-current')) btn.setAttribute('aria-current', String(active));
    });
    const cvBtn = document.querySelector('.btn-cta[download]');
    if (cvBtn && tr.hero_cta_href) cvBtn.href = tr.hero_cta_href;
    const stat2El = document.querySelector('[data-i18n-suf="stat2_suf"]');
    if (stat2El && tr.stat2_suf) stat2El.dataset.suf = tr.stat2_suf;
    if (tr.hero_typewriter_words) restartTypewriter(tr.hero_typewriter_words);
  }

  async function loadLang(lang) {
    if (!cache[lang]) {
      try {
        const res = await fetch('locales/' + lang + '.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        cache[lang] = await res.json();
      } catch (e) { return; }
    }
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations(cache[lang], lang);
  }

  document.querySelectorAll('.lang-btn, .lang-mob-btn').forEach(btn => {
    btn.addEventListener('click', () => loadLang(btn.dataset.lang));
  });

  if (currentLang !== 'fr') { loadLang(currentLang); }
  else { fetch('locales/fr.json').then(r => r.json()).then(d => { cache['fr'] = d; }); }
})();
