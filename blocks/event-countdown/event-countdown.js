import { readBlockConfig } from '../../scripts/aem.js';
import { nflCalendar, timeEl, newTabHint } from '../../scripts/nfl-utils.js';
import { icon } from '../../scripts/nfl-icons.js';
import {
  loadPlaceholders, localize, pageLanguage, pageLocale, t,
} from '../../scripts/placeholders.js';

/* 02 · Countdown / event bar — prototype index.html L69-89.
   Behaviours: recordatorio (script.js L113-127) and cuenta atrás animada (L134-190).
   The prototype queried `.event-bar …` on the document; here queries are scoped to the block. */

// [data-unit, clave de la hoja, texto en español]
const UNITS = [
  ['days', 'countdown-days', 'días'],
  ['hours', 'countdown-hours', 'horas'],
  ['mins', 'countdown-minutes', 'min'],
];

function buildDate(text, target) {
  const p = document.createElement('p');
  p.className = 'event-bar__date';
  p.setAttribute('data-fallback', '');
  const idx = text.indexOf(' · ');
  const datetime = target ? target.replace(/(T\d{2}:\d{2}):\d{2}/, '$1') : '';
  if (idx < 0) {
    p.append(timeEl(text, datetime || undefined));
  } else {
    p.append(
      document.createTextNode(text.slice(0, idx + 3)),
      timeEl(text.slice(idx + 3), datetime || undefined),
    );
  }
  return p;
}

function buildCountdown(target) {
  const box = document.createElement('div');
  box.className = 'event-bar__countdown countdown';
  box.setAttribute('data-countdown', target);
  box.hidden = true;
  box.innerHTML = `<p class="visually-hidden" data-countdown-label></p>
    <span class="countdown__lead" aria-hidden="true"></span>
    <div class="countdown__units" aria-hidden="true">${UNITS.map(([unit]) => `<div class="countdown__unit"><span class="countdown__value" data-unit="${unit}">00</span><span class="countdown__label"></span></div>`).join('')}</div>`;
  localize(() => {
    box.querySelector('.countdown__lead').textContent = t('countdown-lead', 'Faltan');
    box.querySelectorAll('.countdown__label').forEach((label, i) => {
      const [, key, fallback] = UNITS[i];
      label.textContent = t(key, fallback);
    });
  });
  return box;
}

function buildCalButton(cfg, target) {
  const cal = document.createElement('button');
  cal.className = 'btn btn--inverse btn--sm event-bar__cal';
  cal.type = 'button';
  cal.hidden = true;
  ['title', 'start', 'end', 'location', 'description'].forEach((k) => {
    const v = cfg[`ics-${k}`];
    if (v) cal.setAttribute(`data-ics-${k}`, v);
  });
  // Sin fila «ICS Start», el evento empieza en la fecha de la cuenta atrás
  if (!cal.hasAttribute('data-ics-start') && target) cal.setAttribute('data-ics-start', target);
  // iPhone: .ics publicado (Safari solo ofrece «Añadir al calendario» con un archivo real).
  // Fila opcional «ICS File»; si no, el del repo. Sus datos deben coincidir con las filas ICS.
  // Por defecto, el del idioma de la página (/en/ → nfl-madrid-game-en.ics)
  const icsFile = `nfl-madrid-game${pageLanguage() === 'en' ? '-en' : ''}.ics`;
  cal.setAttribute('data-ics-file', cfg['ics-file'] || `${window.hlx.codeBasePath}/calendar/${icsFile}`);
  if (cfg['ics-allday']) cal.setAttribute('data-ics-allday', '');
  const hidden = document.createElement('span');
  hidden.className = 'visually-hidden';
  const label = document.createElement('span');
  label.className = 'event-bar__cal-label';
  localize(() => {
    hidden.textContent = `: ${t('countdown-remind-hint', 'añadir el NFL Madrid Game a tu calendario')}`;
    label.textContent = t('countdown-remind', 'Recuérdamelo');
  });
  cal.append(icon('calendar', 'icon'), label, hidden);
  const wrap = document.createElement('div');
  wrap.className = 'event-bar__cal-wrap';
  wrap.append(cal);
  return wrap;
}

/* Escritorio: menú para elegir calendario (la web no sabe cuál usa cada persona).
   Patrón «disclosure»: botón con aria-expanded + lista de enlaces. */
const CAL_OPTIONS = [
  ['google', 'Google Calendar'],
  ['outlook', 'Outlook.com'],
  ['office', 'Outlook (Microsoft 365)'],
];

function buildCalMenu(cal, urls) {
  const menu = document.createElement('ul');
  menu.className = 'event-bar__cal-menu';
  menu.id = 'event-bar-cal-menu';
  menu.setAttribute('role', 'list');
  menu.hidden = true;
  CAL_OPTIONS.forEach(([key, text]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = urls[key];
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = text;
    a.append(newTabHint());
    li.append(a);
    menu.append(li);
  });
  const li = document.createElement('li');
  const ics = document.createElement('button');
  ics.type = 'button';
  ics.textContent = t('countdown-ics', 'Apple Calendar u otro (.ics)');
  ics.addEventListener('click', () => nflCalendar.downloadIcs(cal));
  li.append(ics);
  menu.append(li);
  cal.setAttribute('aria-controls', menu.id);
  cal.setAttribute('aria-expanded', 'false');
  return menu;
}

function initCalMenu(cal) {
  let menu;
  const wrap = cal.parentElement;

  function setOpen(open, { focusButton = false } = {}) {
    if (!menu) return;
    menu.hidden = !open;
    cal.setAttribute('aria-expanded', String(open));
    if (focusButton) cal.focus();
  }

  cal.addEventListener('click', () => {
    if (nflCalendar.addDirect(cal)) return; // móvil: acción directa
    if (!menu) {
      const urls = nflCalendar.links(cal);
      if (!urls) return;
      menu = buildCalMenu(cal, urls);
      wrap.append(menu);
      menu.addEventListener('click', (e) => { if (e.target.closest('a, button')) setOpen(false); });
    }
    const open = menu.hidden;
    setOpen(open);
    if (open) menu.querySelector('a').focus();
  });

  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && !menu.hidden) setOpen(false, { focusButton: true });
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
  wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) setOpen(false); });
}

/* ─── Recordatorio — script.js L113-127 ─── */
function initReminder(block) {
  const el = block.querySelector('.event-bar__countdown');
  if (!el) return;
  const target = new Date(el.getAttribute('data-countdown')).getTime();
  if (Number.isNaN(target) || target <= Date.now()) return; // se queda la fecha de reserva

  const cal = block.querySelector('.event-bar__cal');
  if (cal) {
    cal.hidden = false;
    initCalMenu(cal);
  }
  // La fecha ya está en el hero: con cuenta atrás activa, la barra no la repite
  const fallback = block.querySelector('[data-fallback]');
  if (fallback) fallback.hidden = true;
}

/* ─── Cuenta atrás animada — script.js L134-190 ─── */
function initCountdown(block) {
  const box = block.querySelector('.countdown');
  if (!box) return;
  const target = new Date(box.getAttribute('data-countdown')).getTime();
  if (Number.isNaN(target) || target <= Date.now()) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = box.querySelector('[data-countdown-label]');
  const cells = {};
  box.querySelectorAll('[data-unit]').forEach((el) => {
    cells[el.getAttribute('data-unit')] = el;
  });
  let lastMinute = -1;
  const plural = new Intl.PluralRules(pageLocale());

  // Frase para lectores de pantalla: cada unidad en singular o plural
  const PARTS = {
    day: ['{count} día', '{count} días'],
    hour: ['{count} hora', '{count} horas'],
    minute: ['{count} minuto', '{count} minutos'],
  };
  function part(unit, count) {
    const [one, other] = PARTS[unit];
    return plural.select(count) === 'one'
      ? t(`countdown-${unit}-one`, one, { count })
      : t(`countdown-${unit}-other`, other, { count });
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function set(unit, value) {
    const el = cells[unit];
    if (el.textContent === value) return;
    el.textContent = value;
    if (!reduce && el.animate) {
      el.animate([
        { transform: 'translateY(60%)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { // evento celebrado: vuelve la fecha, nunca un contador negativo
      box.hidden = true;
      const fallback = block.querySelector('[data-fallback]');
      if (fallback) fallback.hidden = false;
      const cal = block.querySelector('.event-bar__cal');
      if (cal) cal.hidden = true;
      return false;
    }
    const sec = Math.floor(diff / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    set('days', pad(days));
    set('hours', pad(hours));
    set('mins', pad(mins));
    if (mins !== lastMinute) {
      lastMinute = mins;
      label.textContent = t(
        'countdown-status',
        'Faltan {days}, {hours} y {minutes} para el NFL Madrid Game.',
        { days: part('day', days), hours: part('hour', hours), minutes: part('minute', mins) },
      );
    }
    return true;
  }

  // Cuando llega la hoja, la frase para lectores de pantalla se rehace en el siguiente segundo
  loadPlaceholders().then(() => { lastMinute = -1; });

  box.hidden = false;
  if (tick()) {
    const timer = setInterval(() => { if (!tick()) clearInterval(timer); }, 1000);
  }
}

export default function decorate(block) {
  const cfg = readBlockConfig(block);
  const target = (cfg.target || '').trim();

  const inner = document.createElement('div');
  inner.className = 'event-bar__inner container';
  if (cfg.date) inner.append(buildDate(cfg.date.trim(), target));
  if (target) inner.append(buildCountdown(target));
  inner.append(buildCalButton(cfg, target));

  block.replaceChildren(inner);
  localize(() => block.setAttribute('aria-label', t('countdown-region', 'Cuenta atrás del evento')));

  initReminder(block);
  initCountdown(block);
}
