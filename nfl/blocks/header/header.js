import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { plainImg } from '../../scripts/nfl-utils.js';
import {
  SITE_ROOT, homePath, isHomePage, languagePaths, localize, normalizePath, t,
} from '../../scripts/placeholders.js';

/* 00 · Header — _referencias/nfl-header-menu (LEEME.md, index.html, script.js).
   Logos, menú de anclas y selector de idioma, todo del documento nav:
   images → logos · the language list (ES, EN…) → idioma · the other list → menú.
   Desktop (≥1024): menú e idioma en línea. Tablet y móvil: hamburguesa que abre
   un panel lateral con las anclas y el idioma como última opción.
   Cabecera fija: se compacta al bajar, se esconde y vuelve al subir. */

const LANG_NAMES = { es: 'Español', en: 'English' };
const LANG_CODE = /^[a-z]{2}$/i;
/* width/height attributes by position (Bernabéu, escudo NFL): aspect ratio
   before the CSS arrives, avoids CLS. The CSS sets the final size. */
const LOGO_SIZES = [[59, 32], [212, 288]];
const DESKTOP = window.matchMedia('(min-width: 1024px)'); // --breakpoint-desktop
const SCROLLED_AT = 8; // px: from here on the header compacts
const SCROLL_DELTA = 4; // px: ignore tiny scroll jitter before hiding/showing
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Metadato Nav; si no, el nav del idioma: /nfl/nav o /nfl/en/nav (borradores: /nfl/drafts/nav). */
function navPath() {
  const navMeta = getMetadata('nav');
  if (navMeta) return new URL(navMeta, window.location).pathname;
  const drafts = `${SITE_ROOT}/drafts/`;
  return window.location.pathname.startsWith(drafts) ? `${drafts}nav` : `${homePath()}nav`;
}

/**
 * Authored anchors may come back as full URLs (https://…/#faq): keep just the hash
 * when they point to this page. Fuera de la portada (p. ej. una noticia), las anclas
 * (#experiencias) llevan a la portada de su idioma: /nfl/#experiencias, /nfl/en/#experiences.
 * @param {HTMLAnchorElement} a authored link
 * @returns {string} href
 */
function toHref(a) {
  const raw = a.getAttribute('href') || '#';
  if (raw.startsWith('#')) return raw.length > 1 && !isHomePage() ? `${homePath()}${raw}` : raw;
  try {
    const url = new URL(raw, window.location.href);
    if (url.hash && url.origin === window.location.origin
      && url.pathname === window.location.pathname) return url.hash;
  } catch (e) {
    // not a URL: leave it as authored
  }
  return raw;
}

const isLangList = (list) => {
  const links = [...list.querySelectorAll('a')];
  return links.length > 0 && links.every((a) => LANG_CODE.test(a.textContent.trim()));
};

/**
 * Selector de idioma «ES | EN» (prototype .lang-switch). Built once per place
 * (header and panel) from the same authored list.
 * @param {Element} list authored <ul> of language links
 * @returns {HTMLElement} nav.lang-switch
 */
function buildLang(list) {
  const lang = document.createElement('nav');
  lang.className = 'lang-switch';
  localize(() => lang.setAttribute('aria-label', t('header-language', 'Idioma')));
  const pageLang = (document.documentElement.lang || 'es').toLowerCase();
  // Fuera de la portada, ES/EN llevan a esta misma página en el otro idioma
  // (metadato Alternate Path o cálculo con /nfl/en/, como el hreflang)
  const equivalents = isHomePage() ? {} : languagePaths();
  const items = [];
  [...list.querySelectorAll('a')].forEach((a) => {
    const code = a.textContent.trim();
    const iso = code.toLowerCase();
    const href = equivalents[iso] || toHref(a);
    const item = document.createElement('a');
    item.className = 'lang-switch__item';
    item.href = href;
    item.lang = iso;
    item.hreflang = iso;
    item.textContent = code;
    if (LANG_NAMES[iso]) {
      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = ` · ${LANG_NAMES[iso]}`;
      item.append(hidden);
    }
    // URL still pending (#): no jump to the top; the clicked language is marked
    // in both selectors (header and panel)
    if (href === '#') {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.lang-switch__item').forEach((other) => {
          if (other.lang === iso) other.setAttribute('aria-current', 'page');
          else other.removeAttribute('aria-current');
        });
      });
    }
    lang.append(item);
    items.push(item);
  });

  // Marcado: el enlace que apunta a esta página; si ninguno, el del idioma de la página
  const here = items.find((item) => !item.getAttribute('href').startsWith('#')
    && item.origin === window.location.origin
    && normalizePath(item.pathname) === normalizePath(window.location.pathname));
  const current = here || items.find((item) => item.lang === pageLang);
  if (current) current.setAttribute('aria-current', 'page');
  return lang;
}

/**
 * Menú de anclas en la cabecera (desktop).
 * @param {Element[]} links authored links
 * @returns {HTMLElement} nav.site-nav
 */
function buildNav(links) {
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.id = 'site-nav';
  localize(() => nav.setAttribute('aria-label', t('header-nav', 'Secciones de la página')));
  const ul = document.createElement('ul');
  ul.className = 'site-nav__list';
  ul.setAttribute('role', 'list');
  links.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'site-nav__link';
    link.href = toHref(a);
    link.textContent = a.textContent.trim();
    li.append(link);
    ul.append(li);
  });
  nav.append(ul);
  return nav;
}

/**
 * Panel lateral (tablet y móvil): fondo, borde curvo, anclas e idioma.
 * @param {Element[]} links authored menu links
 * @param {Element} [langList] authored language list
 * @returns {{drawer: HTMLElement, panel: HTMLElement}}
 */
function buildDrawer(links, langList) {
  const drawer = document.createElement('div');
  drawer.className = 'menu-drawer';
  drawer.id = 'menu-drawer';
  drawer.inert = true;

  const backdrop = document.createElement('div');
  backdrop.className = 'menu-drawer__backdrop';

  const panel = document.createElement('div');
  panel.className = 'menu-drawer__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  localize(() => panel.setAttribute('aria-label', t('header-menu', 'Menú')));
  panel.tabIndex = -1;

  // Borde curvo: un abombado a la izquierda del panel que se aplana al abrir
  const curve = document.createElementNS(SVG_NS, 'svg');
  curve.setAttribute('class', 'menu-drawer__curve');
  curve.setAttribute('viewBox', '0 0 100 100');
  curve.setAttribute('preserveAspectRatio', 'none');
  curve.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M100 0 Q-100 50 100 100 Z');
  curve.append(path);

  const ol = document.createElement('ol');
  ol.className = 'menu-drawer__list';
  ol.setAttribute('role', 'list');
  links.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'menu-drawer__link';
    link.href = toHref(a);
    const text = document.createElement('span');
    text.className = 'menu-drawer__text';
    text.textContent = a.textContent.trim();
    link.append(text);
    li.append(link);
    ol.append(li);
  });

  panel.append(curve, ol);
  if (langList) {
    const langBox = document.createElement('div');
    langBox.className = 'menu-drawer__lang';
    langBox.append(buildLang(langList));
    panel.append(langBox);
  }

  drawer.append(backdrop, panel);
  return { drawer, panel };
}

function buildMenuButton() {
  const btn = document.createElement('button');
  btn.className = 'site-header__menu-btn';
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'menu-drawer');
  const burger = document.createElement('span');
  burger.className = 'site-header__burger';
  burger.setAttribute('aria-hidden', 'true');
  burger.append(...[1, 2, 3].map(() => document.createElement('span')));
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  btn.append(burger, label); // texto: initMenu (según abierto/cerrado)
  return { btn, label };
}

/**
 * Panel: abre/cierra, foco atrapado, Esc, fondo, enlaces y paso a desktop.
 */
function initMenu(header, btn, label, drawer, panel) {
  const isOpen = () => header.classList.contains('site-header--open');
  const updateLabel = () => {
    label.textContent = isOpen()
      ? t('header-menu-close', 'Cerrar menú')
      : t('header-menu-open', 'Abrir menú');
  };
  localize(updateLabel);

  const setOpen = (open, returnFocus) => {
    header.classList.toggle('site-header--open', open);
    // Sin scroll de la página con el panel abierto
    document.documentElement.classList.toggle('menu-is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    updateLabel();
    drawer.inert = !open;
    if (open) {
      // El foco va al panel (sin marco visible); con Tab se entra en las anclas
      panel.focus({ preventScroll: true });
    } else if (returnFocus) {
      btn.focus();
    }
  };

  btn.addEventListener('click', () => setOpen(!isOpen(), true));

  drawer.addEventListener('click', (e) => {
    if (e.target.classList.contains('menu-drawer__backdrop')) setOpen(false, true);
    else if (e.target.closest('.menu-drawer__link')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      setOpen(false, true);
      return;
    }
    // El foco no sale del menú: anclas, idioma y el botón de cerrar
    if (e.key === 'Tab') {
      const items = [...panel.querySelectorAll('a[href], button:not([disabled])'), btn];
      const index = items.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && index === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
  });

  // Al pasar a desktop, el menú vuelve a la cabecera y el panel se cierra
  DESKTOP.addEventListener('change', () => {
    if (DESKTOP.matches && isOpen()) setOpen(false);
  });
}

/**
 * Cabecera fija: compacta al bajar (--scrolled), escondida si se sigue bajando
 * (--hidden) y de vuelta al subir. Nunca escondida con el menú abierto ni con
 * el foco dentro. Ancla activa: la sección que cruza la mitad de la pantalla.
 */
function initScroll(header) {
  const links = [...header.querySelectorAll('.site-nav__link, .menu-drawer__link')]
    .filter((a) => a.getAttribute('href').length > 1 && a.getAttribute('href').startsWith('#'));
  const sections = [...new Set(links.map((a) => a.getAttribute('href').slice(1)))]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((a) => {
      if (id && a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('site-header--scrolled', y > SCROLLED_AT);
    if (header.classList.contains('site-header--open')
      || header.contains(document.activeElement)
      || y < header.offsetHeight * 2) {
      header.classList.remove('site-header--hidden');
    } else if (y > lastY + SCROLL_DELTA) {
      header.classList.add('site-header--hidden');
    } else if (y < lastY - SCROLL_DELTA) {
      header.classList.remove('site-header--hidden');
    }
    lastY = y;

    // Arriba del todo, sobre el hero, ninguna sección cruza la mitad: ninguna activa
    const middle = window.innerHeight / 2;
    const current = sections.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= middle && r.bottom > middle;
    });
    setActive(current ? current.id : '');
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  header.addEventListener('focusin', () => header.classList.remove('site-header--hidden'));

  // Al pulsar una opción se marca al momento
  header.addEventListener('click', (e) => {
    const a = e.target.closest('.site-nav__link, .menu-drawer__link');
    if (a) setActive(a.getAttribute('href').slice(1));
  });

  update();
}

/**
 * loads and decorates the header (nav fragment)
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await loadFragment(navPath());
  block.textContent = '';
  if (!fragment) return;

  // the <header> element plays the prototype's header.site-header
  const header = block.closest('header');
  if (!header) return;
  header.classList.add('site-header');

  const inner = document.createElement('div');
  inner.className = 'site-header__inner container';

  // logos: every image of the fragment, in order (first screen: no lazy loading)
  const logos = document.createElement('div');
  logos.className = 'site-header__logos';
  [...fragment.querySelectorAll('img')].forEach((img, i) => {
    const size = LOGO_SIZES[i] || [];
    logos.append(plainImg(img, 'site-header__logo', {
      lazy: false, width: size[0], height: size[1],
    }));
  });
  inner.append(logos);

  const lists = [...fragment.querySelectorAll('ul, ol')];
  const langList = lists.find(isLangList);
  const menuList = lists.find((list) => list !== langList);
  const menuLinks = menuList ? [...menuList.querySelectorAll('a')] : [];

  if (menuLinks.length) inner.append(buildNav(menuLinks));

  const tools = document.createElement('div');
  tools.className = 'site-header__tools';
  if (langList) tools.append(buildLang(langList));
  inner.append(tools);
  block.append(inner);

  // Hamburguesa y panel solo si hay algo que poner dentro
  if (menuLinks.length || langList) {
    const { btn, label } = buildMenuButton();
    tools.append(btn);
    const { drawer, panel } = buildDrawer(menuLinks, langList);
    block.append(drawer);
    initMenu(header, btn, label, drawer, panel);
  }

  initScroll(header);

  // skip link, first child of <body> (prototype index.html L19)
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#contenido';
    localize(() => { skip.textContent = t('header-skip-link', 'Saltar al contenido'); });
    document.body.prepend(skip);
  }
}
