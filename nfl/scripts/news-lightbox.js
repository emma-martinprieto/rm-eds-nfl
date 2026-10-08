/*
 * Lightbox de noticias — «Leer más» de las tarjetas de Noticias (cards `news`).
 * Intercepta el clic, carga la página de la noticia (.plain.html, con sus bloques decorados,
 * como el bloque fragment) y la muestra en un <dialog> modal. Sin JS, o si la carga falla,
 * el enlace navega a la página.
 * Historial: al abrir, la URL y el título pasan a ser los de la noticia (pushState); al cerrar
 * se vuelve atrás, así que «Atrás» cierra el lightbox y «Adelante» lo vuelve a abrir. Si se
 * recarga con la URL de la noticia, se ve su página suelta.
 * Estilos: styles/news-lightbox.css (panel) + styles/news-article.css (artículo).
 */
import { loadCSS } from './aem.js';
import { icon } from './nfl-icons.js';
import { normalizePath, t } from './placeholders.js';
import { decorateArticle, loadArticleStyles } from './news-article.js';

const TABLET = window.matchMedia('(min-width: 768px)'); // --breakpoint-tablet
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
const CLOSE_FALLBACK = 400; // ms: por si no llega animationend (> --lightbox-out)

const articles = new Map(); // ruta → artículo ya decorado (se reutiliza al volver a abrir)
const links = new Map(); // ruta → «Leer más» (para devolver el foco al abrir desde el historial)
let landingTitle;
let dialog;
let panel;
let trigger;
let afterClose; // en vez de devolver el foco a «Leer más» (ancla de esta página)
let finishClosing; // cierra ya, sin esperar a la animación
let wanted = null; // ruta que pide el historial (si cambia mientras carga, no se abre)

/** Ruta de la noticia si es de este sitio; si no, null (el enlace navega). */
function articlePath(link) {
  try {
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return url.pathname.replace(/\.html$/, '');
  } catch (e) {
    return null;
  }
}

/** Entrada del historial creada por el lightbox: { newsLightbox: ruta, category }. */
function lightboxState(state) {
  return state && typeof state.newsLightbox === 'string' ? state : null;
}

async function getArticle(path, category) {
  if (!articles.has(path)) {
    const pending = (async () => {
      // eslint-disable-next-line import/no-cycle
      const { loadFragment } = await import('../blocks/fragment/fragment.js');
      const main = await loadFragment(path);
      if (!main || !main.querySelector('h1')) throw new Error(`news: ${path} sin contenido`);
      const article = document.createElement('div');
      article.append(...main.childNodes);
      decorateArticle(article, { category });
      return article;
    })();
    articles.set(path, pending);
    pending.catch(() => articles.delete(path));
  }
  return articles.get(path);
}

/** Artículo y estilos del lightbox. */
async function load(path, category) {
  const [article] = await Promise.all([
    getArticle(path, category),
    loadCSS(`${window.hlx.codeBasePath}/styles/news-lightbox.css`),
    loadArticleStyles(),
  ]);
  return article;
}

function close() {
  if (!dialog || !dialog.open || finishClosing) return;
  let timer;
  const onEnd = (e) => {
    if (e.target !== dialog) return;
    finishClosing();
  };
  finishClosing = () => {
    clearTimeout(timer);
    dialog.removeEventListener('animationend', onEnd);
    finishClosing = null;
    dialog.classList.remove('is-closing');
    dialog.close();
  };
  if (REDUCE.matches) {
    finishClosing();
    return;
  }
  // Al revés que al abrir: el panel baja y se desvanece, y el fondo se va (--lightbox-out)
  dialog.addEventListener('animationend', onEnd);
  timer = setTimeout(finishClosing, CLOSE_FALLBACK);
  dialog.classList.add('is-closing');
}

/**
 * X, «Cerrar», Esc, clic fuera: si la URL es la de la noticia, atrás en el historial
 * (popstate cierra); así «Adelante» la vuelve a abrir y no se acumulan entradas.
 */
function requestClose() {
  if (lightboxState(window.history.state)) window.history.back();
  else close();
}

function closeButton(className, content) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.append(content);
  btn.addEventListener('click', requestClose);
  return btn;
}

function buildDialog() {
  dialog = document.createElement('dialog');
  dialog.className = 'news-lightbox';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  // Panel con scroll propio; recibe el foco al abrir
  panel = document.createElement('div');
  panel.className = 'news-lightbox__panel';
  panel.tabIndex = -1;

  // X arriba a la derecha, sobre la foto; fija mientras se hace scroll
  const bar = document.createElement('div');
  bar.className = 'news-lightbox__bar';
  const x = closeButton('row-arrow news-lightbox__close', icon('close', 'row-arrow__icon'));
  x.setAttribute('aria-label', t('news-close', 'Cerrar'));
  bar.append(x);

  // «Cerrar» al final del artículo: enlace de texto a la derecha
  const foot = document.createElement('p');
  foot.className = 'news-lightbox__foot';
  foot.append(closeButton('news-lightbox__done', t('news-close', 'Cerrar')));

  panel.append(bar, foot);
  dialog.append(panel);

  // Esc: con la misma animación de cierre
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    requestClose();
  });
  // Fuera del panel (el fondo es del propio <dialog>): solo en web y tablet
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && TABLET.matches) requestClose();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return; // se ha vuelto a abrir antes de que llegara el evento
    document.documentElement.classList.remove('news-lightbox-open');
    document.title = landingTitle;
    if (afterClose) afterClose();
    else if (trigger) trigger.focus({ preventScroll: true });
    afterClose = null;
    trigger = null;
  });

  // Enlaces a una sección de esta misma página (p. ej. el botón /#entradas en la landing):
  // se cierra el lightbox y la página baja hasta la sección, sin recargar
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, window.location.href);
    if (!url.hash || url.origin !== window.location.origin
      || normalizePath(url.pathname) !== normalizePath(window.location.pathname)) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    afterClose = () => {
      // Ya en la URL de la landing (requestClose ha ido atrás)
      window.history.pushState(null, '', url.hash);
      target.scrollIntoView({ behavior: REDUCE.matches ? 'instant' : 'smooth', block: 'start' });
      // El foco pasa a la sección (lectores de pantalla y teclado siguen desde ahí)
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    requestClose();
  });
  document.body.append(dialog);
}

function open(article, link) {
  if (!dialog) buildDialog();
  if (finishClosing) finishClosing(); // «Adelante» mientras aún se estaba cerrando
  // barra de la X · artículo · «Cerrar»
  panel.replaceChildren(panel.firstElementChild, article, panel.lastElementChild);
  const title = article.querySelector('.news-article__title');
  if (title) dialog.setAttribute('aria-labelledby', title.id);
  if (title) document.title = title.textContent.trim();
  trigger = link;
  document.documentElement.classList.add('news-lightbox-open'); // la página no hace scroll
  dialog.showModal();
  panel.scrollTop = 0;
  panel.focus({ preventScroll: true });
}

/** «Atrás» / «Adelante»: abre o cierra según la entrada del historial. */
async function onPopState(e) {
  const state = lightboxState(e.state);
  wanted = state && state.newsLightbox;
  if (!state) {
    close();
    return;
  }
  const path = state.newsLightbox;
  try {
    const article = await load(path, state.category);
    if (wanted === path) open(article, links.get(path));
  } catch (error) {
    if (wanted === path) window.location.reload(); // la URL ya es la de la noticia
  }
}

/**
 * @param {Iterable<HTMLAnchorElement>} cardLinks «Leer más» de las tarjetas
 *   (data-category: categoría de la tarjeta, por si la página no la trae)
 */
export default function initNewsLightbox(cardLinks) {
  if (!('HTMLDialogElement' in window)) return; // navegador antiguo: el enlace navega
  if (landingTitle === undefined) {
    landingTitle = document.title;
    window.addEventListener('popstate', onPopState);
  }
  let busy = false;
  [...cardLinks].forEach((link) => {
    const path = articlePath(link);
    if (path && !links.has(path)) links.set(path, link);
    link.addEventListener('click', async (e) => {
      // Ctrl/⌘/Mayús/rueda: abrir en otra pestaña o ventana, como siempre
      const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      if (e.defaultPrevented || e.button !== 0 || modified || !path) return;
      e.preventDefault();
      if (busy) return;
      busy = true;
      link.setAttribute('aria-busy', 'true');
      try {
        const { category } = link.dataset;
        const article = await load(path, category);
        // Antes de cambiar el título: la entrada de la landing conserva el suyo
        window.history.pushState({ newsLightbox: path, category }, '', link.href);
        wanted = path;
        open(article, link);
      } catch (error) {
        window.location.href = link.href; // si falla, a la página de la noticia
      } finally {
        busy = false;
        link.removeAttribute('aria-busy');
      }
    });
  });
}
