import { plainImg, cleanLink } from '../../scripts/nfl-utils.js';
import { icon, iconSvg } from '../../scripts/nfl-icons.js';

/* 04 · Experiencias Madridista — prototype index.html L92-220.
   Behaviours: finalizadas/agotadas (script.js L199-230), filtro por nivel (L236-262),
   aparición en cascada (L273-322). Selectors are scoped to the block / its section. */

const FILTER_HTML = `<summary class="xp-filter__toggle"><span>Filtrar por nivel<span class="xp-filter__current" data-filter-current></span></span>${iconSvg('chevron-down', 'xp-filter__icon')}</summary>
  <fieldset class="xp-filter__options">
    <legend class="visually-hidden">Ver experiencias para</legend>
    <label class="xp-filter__chip"><input class="visually-hidden" type="radio" name="xp-level" value="all" checked><span>Todas</span></label>
    <label class="xp-filter__chip"><input class="visually-hidden" type="radio" name="xp-level" value="free"><span>Free</span></label>
    <label class="xp-filter__chip"><input class="visually-hidden" type="radio" name="xp-level" value="premium"><span>Premium</span></label>
    <label class="xp-filter__chip"><input class="visually-hidden" type="radio" name="xp-level" value="platinum"><span>Platinum</span></label>
  </fieldset>`;

function readSettings(cell) {
  const cfg = {};
  if (!cell) return cfg;
  const lines = [...cell.querySelectorAll('p')].map((p) => p.textContent);
  if (!lines.length) lines.push(...cell.textContent.split('\n'));
  lines.forEach((line) => {
    const i = line.indexOf(':');
    if (i < 0) return;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (key && value) cfg[key] = value;
  });
  return cfg;
}

function buildMedia(imgCell, dateCell, cfg) {
  const media = document.createElement('div');
  media.className = 'xp-row__media';
  const img = imgCell && imgCell.querySelector('img');
  if (img) media.append(plainImg(img, 'xp-row__img'));

  const [day, month] = dateCell ? [...dateCell.querySelectorAll('p')].map((p) => p.textContent.trim()) : [];
  if (day || month) {
    const date = document.createElement(cfg.datetime ? 'time' : 'p');
    date.className = 'xp-row__date';
    if (cfg.datetime) date.dateTime = cfg.datetime;
    date.innerHTML = '<span class="xp-row__day"></span><span class="xp-row__month"></span>';
    date.querySelector('.xp-row__day').textContent = day || '';
    date.querySelector('.xp-row__month').textContent = month || '';
    media.append(date);
  }

  if (cfg.flag) {
    const flag = document.createElement('span');
    flag.className = 'xp-row__flag';
    flag.append(icon('star'), cfg.flag);
    media.append(flag);
  }
  return media;
}

function buildBody(cell, cfg) {
  const body = document.createElement('div');
  body.className = 'xp-row__body';
  if (!cell) return body;
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const paras = [...cell.querySelectorAll(':scope > p')];
  const kids = [...cell.children];
  const hIdx = heading ? kids.indexOf(heading) : -1;
  const before = paras.filter((p) => kids.indexOf(p) < hIdx);
  const after = paras.filter((p) => !before.includes(p));

  before.forEach((p) => {
    const badge = document.createElement('span');
    badge.className = `badge${cfg.badge ? ` badge--${cfg.badge}` : ''}`;
    badge.textContent = p.textContent.trim();
    body.append(badge);
  });
  if (heading) {
    const h3 = document.createElement('h3');
    h3.className = 'xp-row__title';
    h3.textContent = heading.textContent.trim();
    body.append(h3);
  }
  after.forEach((p, i) => {
    const el = document.createElement('p');
    el.className = i === 0 && after.length > 1 ? 'xp-row__place' : 'xp-row__text';
    el.textContent = p.textContent.trim();
    body.append(el);
  });
  return body;
}

function buildAction(cell) {
  const action = document.createElement('div');
  action.className = 'xp-row__action';
  const paras = cell ? [...cell.querySelectorAll(':scope > p')] : [];
  const labelP = paras.find((p) => !p.querySelector('a'));
  const btn = document.createElement('button');
  btn.className = 'btn btn--primary btn--sm xp-row__cta';
  btn.type = 'button';
  btn.textContent = labelP ? labelP.textContent.trim() : 'Participar';
  action.append(btn);

  const upgradeP = paras.find((p) => p.querySelector('a'));
  if (upgradeP) {
    const a = upgradeP.querySelector('a');
    const link = cleanLink(a, 'xp-row__upgrade');
    const labelText = a.textContent.trim();
    const hintText = upgradeP.textContent.replace(a.textContent, '').trim();
    link.textContent = '';
    if (hintText) {
      const hint = document.createElement('span');
      hint.className = 'xp-row__upgrade-hint';
      hint.textContent = hintText;
      link.append(hint, ' ');
    }
    const label = document.createElement('span');
    label.className = 'xp-row__upgrade-label';
    label.textContent = labelText;
    link.append(label, icon('chevron-right'));
    action.append(link);
  }
  return action;
}

/* ─── Finalizadas y agotadas — script.js L199-230 ─── */
function applyStates(rows) {
  const now = Date.now();

  function state(row, text) {
    let box = row.querySelector('.xp-row__action');
    if (!box) {
      box = document.createElement('div');
      box.className = 'xp-row__action';
      row.appendChild(box);
    }
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn--sm xp-row__cta';
    btn.type = 'button';
    btn.disabled = true;
    btn.textContent = text;
    box.innerHTML = '';
    box.appendChild(btn);
  }

  rows.forEach((row) => {
    const endAttr = row.getAttribute('data-end');
    const end = endAttr ? new Date(endAttr).getTime() : NaN;

    if (!Number.isNaN(end) && end <= now) {
      row.classList.add('xp-row--past');
      state(row, 'Finalizada');
    } else if (row.getAttribute('data-status') === 'agotado') {
      state(row, 'Agotado');
    }
  });
}

/* ─── Filtro por nivel — script.js L236-262 ─── */
function initFilter(block) {
  const filter = block.querySelector('.xp-filter');
  if (!filter) return;

  const RANK = { free: 1, premium: 2, platinum: 3 };
  const NAMES = { free: 'Free', premium: 'Premium', platinum: 'Platinum' };
  const current = filter.querySelector('[data-filter-current]');
  const status = block.querySelector('[data-filter-status]');
  const items = block.querySelectorAll('.xp-row');

  function apply(level) {
    let shown = 0;
    items.forEach((item) => {
      const need = RANK[item.getAttribute('data-level')];
      const visible = level === 'all' || !need || need <= RANK[level];
      item.hidden = !visible;
      if (visible) shown += 1;
    });
    current.textContent = level === 'all' ? '' : `: ${NAMES[level]}`;
    status.textContent = `${shown}${shown === 1 ? ' experiencia' : ' experiencias'}${
      level === 'all' ? '' : ` para Madridista ${NAMES[level]}`}`;
  }

  filter.addEventListener('change', (event) => {
    if (event.target.name === 'xp-level') apply(event.target.value);
  });
}

/* ─── Aparición en cascada — script.js L273-322 ─── */
function initReveal(section) {
  if (!section || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STAGGER = 90; // ms entre un elemento y el siguiente
  const MAX_DELAY = 450; // ms, tope del escalonado

  function done(event) {
    if (event.propertyName !== 'opacity') return;
    const el = event.currentTarget;
    el.removeEventListener('transitionend', done);
    el.classList.remove('reveal', 'is-visible');
    el.style.transitionDelay = '';
  }

  // Fuera de pantalla por abajo: se deja listo para volver a entrar
  function reset(el) {
    el.removeEventListener('transitionend', done);
    el.style.transitionDelay = '';
    el.classList.remove('is-visible');
    el.classList.add('reveal');
  }

  const observer = new IntersectionObserver((entries) => {
    // orden dentro del grupo que entra a la vez (entries llega en orden del documento)
    let step = 0;
    entries.forEach((entry) => {
      const el = entry.target;

      if (!entry.isIntersecting) {
        const bottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight;
        if (entry.boundingClientRect.top >= bottom) reset(el);
        return;
      }

      if (!el.classList.contains('reveal') || el.classList.contains('is-visible')) return;
      el.style.transitionDelay = `${Math.min(step * STAGGER, MAX_DELAY)}ms`;
      el.addEventListener('transitionend', done);
      el.classList.add('is-visible');
      step += 1;
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  section.querySelectorAll('.section-head, .xp-filter, .xp-row').forEach((item) => {
    item.classList.add('reveal');
    observer.observe(item);
  });
}

export default function decorate(block) {
  const section = block.closest('.section');

  // hook: the section head is the default content before the block
  const head = section && section.querySelector(':scope > .default-content-wrapper');
  if (head) {
    head.classList.add('section-head');
    const h2 = head.querySelector('h2');
    if (h2) h2.classList.add('section-head__title');
    const lead = head.querySelector('p');
    if (lead) lead.classList.add('section-head__lead');
  }

  const filter = document.createElement('details');
  filter.className = 'xp-filter';
  filter.innerHTML = FILTER_HTML;

  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('data-filter-status', '');

  const list = document.createElement('ol');
  list.className = 'xp-list';
  list.setAttribute('role', 'list');

  [...block.children].forEach((row) => {
    const [imgCell, dateCell, cfgCell, bodyCell, actionCell] = [...row.children];
    const cfg = readSettings(cfgCell);
    const li = document.createElement('li');
    li.className = `xp-row${cfg.flag ? ' xp-row--featured' : ''}`;
    if (cfg.level) li.setAttribute('data-level', cfg.level);
    if (cfg.end) li.setAttribute('data-end', cfg.end);
    if (cfg.status) li.setAttribute('data-status', cfg.status);
    li.append(
      buildMedia(imgCell, dateCell, cfg),
      buildBody(bodyCell, cfg),
      buildAction(actionCell),
    );
    list.append(li);
  });

  block.replaceChildren(filter, status, list);

  applyStates(block.querySelectorAll('.xp-row'));
  initFilter(block);
  initReveal(section);
}
