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

function download(el) {
  const allDay = el.hasAttribute('data-ics-allday');
  const prop = allDay ? ';VALUE=DATE:' : ':';
  const title = el.getAttribute('data-ics-title');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Real Madrid//NFL Madrid Game//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${slug(title)}-${el.getAttribute('data-ics-start').slice(0, 10)}@nfl-madrid-game`,
    `DTSTAMP:${icsDate(new Date().toISOString(), false)}`,
    `DTSTART${prop}${icsDate(el.getAttribute('data-ics-start'), allDay)}`,
    `DTEND${prop}${icsDate(el.getAttribute('data-ics-end'), allDay)}`,
    `SUMMARY:${esc(title)}`,
  ];
  const desc = el.getAttribute('data-ics-description');
  if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
  if (el.getAttribute('data-ics-location')) lines.push(`LOCATION:${esc(el.getAttribute('data-ics-location'))}`);
  // Aviso un día antes
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `nfl-madrid-game-${slug(title.split(' · ')[0])}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
}

export const nflCalendar = { download };
