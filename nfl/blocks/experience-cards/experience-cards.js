import { plainImg, cleanLink, toButton } from '../../scripts/nfl-utils.js';
import { icon, iconSvg } from '../../scripts/nfl-icons.js';
import initReveal from '../../scripts/reveal.js';
import { loadPlaceholders, pageLocale, t } from '../../scripts/placeholders.js';

/* 04 · Experiencias Madridista — prototype index.html L92-220.
   Behaviours: finalizadas/agotadas (script.js L199-230), filtro por nivel (L236-262),
   aparición en cascada (L273-322). Selectors are scoped to the block / its section. */

const LEVELS = ['free', 'premium', 'platinum', 'junior'];
const LEVEL_NAMES = {
  free: 'Free', premium: 'Premium', platinum: 'Platinum', junior: 'Junior',
};
const levelName = (level) => t(`xp-level-${level}`, LEVEL_NAMES[level]);

// Valores de «status:» en la celda de ajustes que marcan la experiencia como agotada
const SOLD_OUT = ['agotado', 'agotada', 'sold out', 'sold-out', 'soldout'];

function buildFilter() {
  const filter = document.createElement('details');
  filter.className = 'xp-filter';
  const chips = ['all', ...LEVELS].map((value) => `<label class="xp-filter__chip"><input class="visually-hidden" type="radio" name="xp-level" value="${value}"${value === 'all' ? ' checked' : ''}><span data-level-name="${value}"></span></label>`).join('');
  filter.innerHTML = `<summary class="xp-filter__toggle"><span><span data-filter-label></span><span class="xp-filter__current" data-filter-current></span></span>${iconSvg('chevron-down', 'xp-filter__icon')}</summary>
  <fieldset class="xp-filter__options"><legend class="visually-hidden"></legend>${chips}</fieldset>`;
  filter.querySelector('[data-filter-label]').textContent = t('filter-by-level', 'Filtrar por nivel');
  filter.querySelector('legend').textContent = t('xp-filter-legend', 'Ver experiencias para');
  filter.querySelectorAll('[data-level-name]').forEach((span) => {
    const value = span.getAttribute('data-level-name');
    span.textContent = value === 'all' ? t('xp-filter-all', 'Todas') : levelName(value);
  });
  return filter;
}

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

/**
 * Variante de la etiqueta según `levels:` (no según su texto, que cambia con el idioma):
 * abierta a todos (free) → verde · con Premium o Junior → dorada · solo Platinum → plateada.
 * Sin `levels:`, la de `badge:`.
 */
function badgeVariant(cfg) {
  const levels = (cfg.levels || '').toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!levels.length) return cfg.badge;
  if (levels.includes('free')) return 'free';
  if (levels.includes('premium') || levels.includes('junior')) return 'premium';
  if (levels.includes('platinum')) return 'platinum';
  return cfg.badge;
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

  const variant = badgeVariant(cfg);
  before.forEach((p) => {
    const badge = document.createElement('span');
    badge.className = `badge${variant ? ` badge--${variant}` : ''}`;
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

const isPreview = () => /\.aem\.page$|^localhost$/.test(window.location.hostname);

// Párrafo con enlace y texto alrededor: el aviso «¿No eres Platinum? Hazte Platinum»
const isUpgrade = (p) => {
  const a = p.querySelector('a');
  return !!a && p.textContent.trim() !== a.textContent.trim();
};

/**
 * CTA de la tarjeta (.xp-row__cta). Con enlace en la celda: <a> con ese href (pestaña
 * nueva si es externo). Sin enlace: desactivado (aria-disabled), no un botón sin acción.
 */
function buildCta(ctaP, title) {
  const a = ctaP && ctaP.querySelector('a');
  const text = (ctaP && ctaP.textContent.trim()) || t('xp-join', 'Participar');
  if (a && a.getAttribute('href')) {
    const link = toButton(a, 'primary', 'sm');
    link.classList.add('xp-row__cta');
    if (!a.textContent.trim()) link.prepend(text);
    return link;
  }
  if (isPreview()) {
    // eslint-disable-next-line no-console
    console.warn(`experience-cards: «${title}» sin enlace en el CTA; se muestra desactivado.`);
  }
  const off = document.createElement('a');
  off.className = 'btn btn--primary btn--sm xp-row__cta';
  off.setAttribute('role', 'link');
  off.setAttribute('aria-disabled', 'true');
  off.textContent = text;
  return off;
}

function buildAction(cell, title) {
  const action = document.createElement('div');
  action.className = 'xp-row__action';
  let paras = cell ? [...cell.querySelectorAll(':scope > p')] : [];
  // Celda de una sola línea sin <p> (DA): la propia celda es el CTA
  if (!paras.length && cell && cell.textContent.trim()) paras = [cell];
  const ctaP = paras.find((p) => !isUpgrade(p));
  action.append(buildCta(ctaP, title));

  const upgradeP = paras.find((p) => p !== ctaP && p.querySelector('a'));
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
      state(row, t('xp-ended', 'Finalizada'));
    } else if (SOLD_OUT.includes((row.getAttribute('data-status') || '').toLowerCase())) {
      state(row, t('xp-sold-out', 'Agotado'));
    }
  });
}

/* ─── Filtro por nivel — script.js L236-262 ─── */
function initFilter(block) {
  const filter = block.querySelector('.xp-filter');
  if (!filter) return;

  // Sin `levels:` (tarjetas antiguas): escalones, cada nivel ve lo suyo y lo inferior
  const RANK = { free: 1, premium: 2, platinum: 3 };
  const current = filter.querySelector('[data-filter-current]');
  const status = block.querySelector('[data-filter-status]');
  const items = block.querySelectorAll('.xp-row');
  const plural = new Intl.PluralRules(pageLocale());

  // «3 experiencias» / «1 experiencia», y con nivel: «… para Madridista Premium»
  function summary(count, level) {
    const text = plural.select(count) === 'one'
      ? t('xp-count-one', '{count} experiencia', { count })
      : t('xp-count-other', '{count} experiencias', { count });
    if (level === 'all') return text;
    return `${text} ${t('xp-count-level', 'para Madridista {level}', { level: levelName(level) })}`;
  }

  function apply(level) {
    let shown = 0;
    items.forEach((item) => {
      let visible;
      const own = item.getAttribute('data-level');
      const levels = (item.getAttribute('data-levels') || '').split(' ').filter(Boolean);
      if (level === 'all' || own === 'tbc' || levels.includes('tbc')) {
        visible = true; // «Todas», o nivel por confirmar: siempre a la vista
      } else if (levels.length) {
        visible = levels.includes(level); // `levels:` lista quién puede participar
      } else {
        const need = RANK[own];
        visible = !need || need <= RANK[level];
      }
      item.hidden = !visible;
      if (visible) shown += 1;
    });
    current.textContent = level === 'all' ? '' : `: ${levelName(level)}`;
    status.textContent = summary(shown, level);
  }

  filter.addEventListener('change', (event) => {
    if (event.target.name === 'xp-level') apply(event.target.value);
  });
}

export default async function decorate(block) {
  await loadPlaceholders();
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

  const filter = buildFilter();

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
    if (cfg.level) li.setAttribute('data-level', cfg.level.toLowerCase());
    // «levels: platinum, junior» → data-levels="platinum junior"
    if (cfg.levels) {
      li.setAttribute('data-levels', cfg.levels.toLowerCase().split(/[\s,]+/).filter(Boolean).join(' '));
    }
    if (cfg.end) li.setAttribute('data-end', cfg.end);
    if (cfg.status) li.setAttribute('data-status', cfg.status);
    const body = buildBody(bodyCell, cfg);
    const title = body.querySelector('.xp-row__title');
    li.append(
      buildMedia(imgCell, dateCell, cfg),
      body,
      buildAction(actionCell, title ? title.textContent : ''),
    );
    list.append(li);
  });

  block.replaceChildren(filter, status, list);

  applyStates(block.querySelectorAll('.xp-row'));
  initFilter(block);
  if (section) initReveal(() => [...section.querySelectorAll('.section-head, .xp-filter, .xp-row')]);
}
