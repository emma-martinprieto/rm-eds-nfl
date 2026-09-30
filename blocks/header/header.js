import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { plainImg } from '../../scripts/nfl-utils.js';

/* 00 · Header — prototype index.html L27-42 (logos + selector de idioma sobre el hero). */

const LANG_NAMES = { es: 'Español', en: 'English' };
const LOGO_MODS = ['bernabeu', 'nfl'];
/* intrinsic sizes of the prototype logos (avoid CLS; CSS fixes the height) */
const LOGO_SIZES = [[1584, 244], [212, 288]];

function navPath() {
  const navMeta = getMetadata('nav');
  if (navMeta) return new URL(navMeta, window.location).pathname;
  return window.location.pathname.startsWith('/drafts/') ? '/drafts/nav' : '/nav';
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
  if (header) header.classList.add('site-header');

  const inner = document.createElement('div');
  inner.className = 'site-header__inner container';

  // logos: every image of the fragment, in order
  const logos = document.createElement('div');
  logos.className = 'site-header__logos';
  [...fragment.querySelectorAll('img')].forEach((img, i) => {
    const mod = LOGO_MODS[i];
    const size = LOGO_SIZES[i] || [];
    logos.append(plainImg(img, `site-header__logo${mod ? ` site-header__logo--${mod}` : ''}`, {
      lazy: false, width: size[0], height: size[1],
    }));
  });

  // language switch: the links of the fragment list
  const lang = document.createElement('nav');
  lang.className = 'lang-switch';
  lang.setAttribute('aria-label', 'Idioma');
  const setCurrent = (current) => {
    lang.querySelectorAll('.lang-switch__item').forEach((el) => {
      if (el === current) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  };
  [...fragment.querySelectorAll('li a')].forEach((a) => {
    const code = a.textContent.trim();
    const iso = code.toLowerCase();
    const href = a.getAttribute('href') || '#';
    const item = document.createElement('a');
    item.className = 'lang-switch__item';
    item.href = href;
    item.lang = iso;
    item.hreflang = iso;
    // links without a real target yet: toggle the active state in place
    if (href.startsWith('#')) {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        setCurrent(item);
      });
    } else if (new URL(href, window.location).pathname === window.location.pathname) {
      item.setAttribute('aria-current', 'page');
    }
    item.textContent = code;
    if (LANG_NAMES[iso]) {
      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = ` · ${LANG_NAMES[iso]}`;
      item.append(hidden);
    }
    lang.append(item);
  });
  if (!lang.querySelector('[aria-current]')) setCurrent(lang.querySelector('.lang-switch__item'));

  inner.append(logos, lang);
  block.append(inner);

  // skip link, first child of <body> (prototype index.html L27)
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#contenido';
    skip.textContent = 'Saltar al contenido';
    document.body.prepend(skip);
  }
}
