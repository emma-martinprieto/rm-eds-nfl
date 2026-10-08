/*
 * Artículo de noticia — la misma presentación en el lightbox (scripts/news-lightbox.js)
 * y en la página de la noticia (metadato `Template: news`). Estilos: styles/news-article.css.
 * Provisional: el diseño de la página de la noticia está pendiente de confirmar.
 *
 * Contenido en DA (el .plain.html no trae los metadatos, así que todo va en el contenido):
 *   foto · «Categoría · fecha» (párrafo justo antes del titular) · titular (H1) · cuerpo
 *   (subtítulos, párrafos, listas, bloque Table, preguntas H3 + párrafo o bloque Accordion,
 *   botón = enlace en negrita).
 */
import { loadCSS } from './aem.js';
import { timeEl, ensureId, externalize } from './nfl-utils.js';
import { homePath, localize, t } from './placeholders.js';

export function loadArticleStyles() {
  return loadCSS(`${window.hlx.codeBasePath}/styles/news-article.css`);
}

/**
 * «Categoría · fecha». Sin « · »: si es una fecha, solo fecha; si no, solo categoría.
 * Si la página no trae categoría, la de la tarjeta (fallback).
 */
function buildMeta(text, fallbackCategory) {
  let category = fallbackCategory || '';
  let date = '';
  const idx = text.indexOf(' · ');
  if (idx >= 0) {
    category = text.slice(0, idx).trim() || category;
    date = text.slice(idx + 3).trim();
  } else if (text && timeEl(text).nodeType === Node.ELEMENT_NODE) {
    date = text;
  } else if (text) {
    category = text;
  }
  if (!category && !date) return null;
  const meta = document.createElement('p');
  meta.className = 'news-article__meta';
  if (category) meta.append(category);
  if (category && date) meta.append(' · ');
  if (date) meta.append(timeEl(date));
  return meta;
}

/** Enlaces en negrita/cursiva (decorateButtons: a.button) → botones del proyecto. */
function decorateCtas(root) {
  root.querySelectorAll('a.button').forEach((a) => {
    const variant = a.classList.contains('secondary') ? 'secondary' : 'primary';
    a.className = `btn btn--${variant}`;
    externalize(a);
    const wrapper = a.closest('.button-wrapper');
    if (wrapper) wrapper.className = 'news-article__button';
  });
}

/**
 * Cierre del artículo en una caja tipo banner (.news-article__cta): desde el último
 * subtítulo (H2) hasta el final, solo si ese tramo lleva un botón. No cambia la autoría.
 * Si el tramo sigue en otras secciones o bloques, también entran en la caja.
 */
function wrapClosingCta(root) {
  const h2s = root.querySelectorAll('h2');
  const h2 = h2s[h2s.length - 1];
  if (!h2) return;

  // El tramo: el H2 y lo que le sigue, subiendo hasta el contenedor del artículo
  const nodes = [];
  for (let el = h2; el && el !== root; el = el.parentElement) {
    if (el === h2) nodes.push(el);
    for (let next = el.nextElementSibling; next; next = next.nextElementSibling) nodes.push(next);
  }
  if (!nodes.some((el) => el.matches('a.btn') || el.querySelector('a.btn'))) return;

  const box = document.createElement('div');
  box.className = 'news-article__cta';
  h2.before(box);
  box.append(...nodes);
}

/**
 * Monta la cabecera del artículo (foto, «categoría · fecha», titular, línea) al principio
 * del contenido y da estilo de artículo a todo lo demás.
 * @param {HTMLElement} root contenedor de las secciones de la noticia
 * @param {object} [opts] { category: categoría de la tarjeta, si la página no la trae }
 * @returns {HTMLElement|null} el titular (para nombrar el diálogo)
 */
export function decorateArticle(root, opts = {}) {
  root.classList.add('news-article');
  const h1 = root.querySelector('h1');
  const first = (h1 && h1.closest('.default-content-wrapper'))
    || root.querySelector('.default-content-wrapper');

  const head = document.createElement('header');
  head.className = 'news-article__head';

  // Foto: la primera imagen antes del titular
  const pic = first && (first.querySelector('picture') || first.querySelector('img'));
  const before = (el) => !h1
    || h1.compareDocumentPosition(el) === Node.DOCUMENT_POSITION_PRECEDING;
  if (pic && before(pic)) {
    const holder = pic.closest('p');
    const media = document.createElement('figure');
    media.className = 'news-article__media';
    media.append(pic);
    if (holder && !holder.textContent.trim() && !holder.querySelector('img')) holder.remove();
    head.append(media);
  }

  // «Categoría · fecha»: el párrafo justo antes del titular
  const prevP = h1 && h1.previousElementSibling;
  const metaP = prevP && prevP.tagName === 'P' && !prevP.querySelector('img') ? prevP : null;
  const meta = buildMeta(metaP ? metaP.textContent.trim() : '', opts.category);
  if (metaP) metaP.remove();
  if (meta) head.append(meta);

  if (h1) {
    h1.classList.add('news-article__title');
    ensureId(h1);
    head.append(h1);
  }
  const rule = document.createElement('hr');
  rule.className = 'news-article__rule';
  head.append(rule);
  (first || root).prepend(head);

  decorateCtas(root);
  wrapClosingCta(root);
  return h1;
}

/** Página de la noticia: «Volver al NFL Madrid Game» al final. */
export function addBackLink(main) {
  const sections = main.querySelectorAll(':scope > .section');
  const last = sections[sections.length - 1];
  if (!last) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'default-content-wrapper';
  const p = document.createElement('p');
  p.className = 'news-article__back';
  const a = document.createElement('a');
  a.href = homePath();
  localize(() => { a.textContent = t('news-page-back', 'Volver al NFL Madrid Game'); });
  p.append(a);
  wrapper.append(p);
  last.append(wrapper);
}
