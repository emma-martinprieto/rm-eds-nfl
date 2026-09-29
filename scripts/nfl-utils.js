/*
 * NFL Madrid Game 2026 — shared helpers for the blocks.
 * nflCalendar is a port of the prototype's js/script.js L17-67 (same .ics output).
 */

/* ─── Authoring helpers ─────────────────────────────────── */

/**
 * Button variant from the authoring convention:
 * bold (<strong><a>, boilerplate `.primary`) = primary; italic (<em><a>, `.secondary`) = inverse.
 * @param {HTMLAnchorElement} a authored link
 * @returns {'primary'|'inverse'}
 */
export function authoredVariant(a) {
  if (a.classList.contains('secondary') || a.closest('em')) return 'inverse';
  return 'primary';
}

/**
 * Adds target/rel + the hidden "(se abre en una pestaña nueva)" text to external links
 * (prototype index.html L383, 384, 406). An author in DA cannot set `target`.
 * @param {HTMLAnchorElement} a link
 * @returns {HTMLAnchorElement}
 */
export function externalize(a) {
  let url;
  try {
    url = new URL(a.href, window.location.href);
  } catch (e) {
    return a;
  }
  if (url.hostname && url.hostname !== window.location.hostname) {
    a.target = '_blank';
    a.rel = 'noopener';
    const hint = document.createElement('span');
    hint.className = 'visually-hidden';
    hint.textContent = ' (se abre en una pestaña nueva)';
    a.append(hint);
  }
  return a;
}

/**
 * Creates a clean link (only href + text) from an authored one.
 * @param {HTMLAnchorElement} a authored link
 * @param {string} [className]
 * @returns {HTMLAnchorElement}
 */
export function cleanLink(a, className = '') {
  const link = document.createElement('a');
  if (className) link.className = className;
  link.href = a.getAttribute('href');
  link.textContent = a.textContent.trim();
  return externalize(link);
}

/**
 * Turns an authored link into a prototype button: a.btn.btn--primary|btn--inverse[.btn--sm].
 * Returns a NEW element (the boilerplate `.button` classes, wrapper and title are dropped).
 * @param {HTMLAnchorElement} a authored link
 * @param {string} [variant] 'primary' | 'inverse' (defaults to the authored convention)
 * @param {string} [size] 'sm' (optional)
 * @returns {HTMLAnchorElement}
 */
export function toButton(a, variant, size) {
  const v = variant || authoredVariant(a);
  const cls = ['btn', `btn--${v}`];
  if (size) cls.push(`btn--${size}`);
  return cleanLink(a, cls.join(' '));
}

/**
 * Creates a plain <img> (no <picture>) from an authored image.
 * @param {HTMLImageElement} img authored image
 * @param {string} [className]
 * @param {object} [opts] { lazy, width, height, alt }
 * @returns {HTMLImageElement}
 */
export function plainImg(img, className = '', opts = {}) {
  const el = document.createElement('img');
  if (className) el.className = className;
  el.src = img.src;
  el.alt = opts.alt !== undefined ? opts.alt : (img.getAttribute('alt') || '');
  if (opts.width) el.width = opts.width;
  if (opts.height) el.height = opts.height;
  if (opts.lazy !== false) el.loading = 'lazy';
  return el;
}

/**
 * Ensures an element has an id (EDS may not render heading ids locally).
 * @param {Element} el
 * @param {string} [fallback]
 * @returns {string} the id
 */
export function ensureId(el, fallback) {
  if (!el.id) {
    const base = (fallback || el.textContent).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let id = base || 'id';
    let n = 1;
    while (document.getElementById(id)) {
      n += 1;
      id = `${base}-${n}`;
    }
    el.id = id;
  }
  return el.id;
}

/* ─── Dates ─────────────────────────────────────────────── */

const MONTHS = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

const pad2 = (n) => String(n).padStart(2, '0');

function lastSunday(year, monthIndex) {
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getUTCDate();
}

/* Madrid offset: CEST (+02:00) between the last Sundays of March and October */
function madridOffset(y, m, d) {
  const key = m * 100 + d;
  const start = 300 + lastSunday(y, 2);
  const end = 1000 + lastSunday(y, 9);
  return key >= start && key < end ? '+02:00' : '+01:00';
}

/**
 * Parses a Spanish date text into an ISO value for <time datetime>.
 * "8 de noviembre de 2026 · 15:30 h" → "2026-11-08T15:30+01:00"; "22 sep 2026" → "2026-09-22".
 * @param {string} text
 * @returns {string|null} ISO value or null when it does not parse
 */
export function parseEsDate(text) {
  const m = /(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\.?\s+(?:de\s+)?(\d{4})/i.exec(text || '');
  if (!m) return null;
  const key = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3);
  const month = MONTHS[key];
  if (!month) return null;
  const day = parseInt(m[1], 10);
  const year = parseInt(m[3], 10);
  const date = `${year}-${pad2(month)}-${pad2(day)}`;
  const t = /(\d{1,2}):(\d{2})\s*h/i.exec(text.slice(m.index + m[0].length));
  if (!t) return date;
  return `${date}T${pad2(parseInt(t[1], 10))}:${t[2]}${madridOffset(year, month, day)}`;
}

/**
 * Builds a <time> element (or a text node when the text does not parse).
 * @param {string} text
 * @param {string} [datetime] explicit value
 * @returns {Node}
 */
export function timeEl(text, datetime) {
  const value = datetime || parseEsDate(text);
  if (!value) return document.createTextNode(text);
  const time = document.createElement('time');
  time.dateTime = value;
  time.textContent = text;
  return time;
}

/* ─── nflCalendar · archivo de calendario (.ics) — script.js L17-67 ─── */
function pad(n) { return pad2(n); }

function icsDate(value, allDay) {
  if (allDay) return value.replace(/-/g, '');
  const d = new Date(value);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${
    pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function esc(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function slug(text) {
  return text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const DEFAULT_TITLE = 'NFL Madrid Game';
const DEFAULT_DURATION = 3 * 60 * 60 * 1000; // sin fin informado: 3 h

/** Reads the event from the data-ics-* attributes, with safe defaults. */
function readEvent(el) {
  const allDay = el.hasAttribute('data-ics-allday');
  const start = el.getAttribute('data-ics-start');
  let end = el.getAttribute('data-ics-end');
  if (!end && !allDay) end = new Date(new Date(start).getTime() + DEFAULT_DURATION).toISOString();
  return {
    allDay,
    start,
    end: end || start,
    title: el.getAttribute('data-ics-title') || DEFAULT_TITLE,
    description: el.getAttribute('data-ics-description') || '',
    location: el.getAttribute('data-ics-location') || '',
  };
}

function buildIcs(ev) {
  const prop = ev.allDay ? ';VALUE=DATE:' : ':';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Real Madrid//NFL Madrid Game//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${slug(ev.title)}-${ev.start.slice(0, 10)}@nfl-madrid-game`,
    `DTSTAMP:${icsDate(new Date().toISOString(), false)}`,
    `DTSTART${prop}${icsDate(ev.start, ev.allDay)}`,
    `DTEND${prop}${icsDate(ev.end, ev.allDay)}`,
    `SUMMARY:${esc(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
  if (ev.location) lines.push(`LOCATION:${esc(ev.location)}`);
  // Aviso un día antes
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${esc(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return lines.join('\r\n');
}

/** Google Calendar «añadir evento» con los datos rellenos (Android no importa .ics). */
function googleUrl(ev) {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', ev.title);
  url.searchParams.set('dates', `${icsDate(ev.start, ev.allDay)}/${icsDate(ev.end, ev.allDay)}`);
  if (ev.description) url.searchParams.set('details', ev.description);
  if (ev.location) url.searchParams.set('location', ev.location);
  url.searchParams.set('ctz', 'Europe/Madrid');
  return url.href;
}

/** Outlook web «nuevo evento» con los datos rellenos. host: outlook.live.com (personal)
    u outlook.office.com (Microsoft 365, cuentas de trabajo). */
function outlookUrl(ev, host) {
  const url = new URL(`https://${host}/calendar/0/action/compose`);
  url.searchParams.set('path', '/calendar/action/compose');
  url.searchParams.set('rru', 'addevent');
  url.searchParams.set('subject', ev.title);
  url.searchParams.set('startdt', new Date(ev.start).toISOString());
  url.searchParams.set('enddt', new Date(ev.end).toISOString());
  url.searchParams.set('allday', String(ev.allDay));
  if (ev.description) url.searchParams.set('body', ev.description);
  if (ev.location) url.searchParams.set('location', ev.location);
  return url.href;
}

function platform() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  // iPadOS se identifica como Mac: se distingue por la pantalla táctil
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

/** Descarga del .ics (Outlook de escritorio, Apple Calendar, Thunderbird…). */
function downloadIcs(el) {
  const ev = readEvent(el);
  if (!ev.start) return;
  const url = URL.createObjectURL(new Blob([buildIcs(ev)], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `nfl-madrid-game-${slug(ev.title.split(' · ')[0])}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
}

/**
 * Móvil: acción directa, la que mejor funciona en cada sistema.
 * - Android: formulario de Google Calendar (su app no importa .ics).
 * - iOS: se navega a un .ics publicado (data-ics-file), sin `download` → Safari muestra
 *   «Añadir al calendario». Safari no lo hace con un .ics generado al vuelo (data:/blob:).
 * @returns {boolean} false en escritorio: ahí el usuario elige en un menú (links())
 */
function addDirect(el) {
  const ev = readEvent(el);
  if (!ev.start) return true;
  const target = platform();
  if (target === 'android') {
    window.open(googleUrl(ev), '_blank', 'noopener');
    return true;
  }
  if (target === 'ios') {
    const file = el.getAttribute('data-ics-file');
    if (file) {
      window.location.href = new URL(file, window.location.href).href;
    } else {
      window.open(googleUrl(ev), '_blank', 'noopener'); // sin archivo publicado
    }
    return true;
  }
  return false;
}

/** Enlaces «añadir evento» de los calendarios web (menú de escritorio). */
function links(el) {
  const ev = readEvent(el);
  if (!ev.start) return null;
  return {
    google: googleUrl(ev),
    outlook: outlookUrl(ev, 'outlook.live.com'),
    office: outlookUrl(ev, 'outlook.office.com'),
  };
}

export const nflCalendar = { addDirect, links, downloadIcs };
