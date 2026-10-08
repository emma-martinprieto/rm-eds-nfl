import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { plainImg, cleanLink } from '../../scripts/nfl-utils.js';
import {
  SITE_ROOT, homePath, loadPlaceholders, t,
} from '../../scripts/placeholders.js';

/* 11 · Footer — prototype index.html L483-508 (3 logos + nav institucional + legal). */

const LOGO_MODS = ['game', 'bernabeu', 'madridistas'];
/* intrinsic sizes of the prototype logos (CSS fixes the height) */
const LOGO_SIZES = [[439, 572], [312, 168], [338, 96]];
// [clave de la hoja, texto en español] por lista, en orden
const NAV_LABELS = [
  ['footer-nav', 'Enlaces institucionales'],
  ['footer-legal', 'Información legal'],
];
const NAV_CLASSES = ['site-footer__nav', 'site-footer__legal'];

/** Metadato Footer; si no, el del idioma: /nfl/footer o /nfl/en/footer (o /nfl/drafts/footer). */
function footerPath() {
  const footerMeta = getMetadata('footer');
  if (footerMeta) return new URL(footerMeta, window.location).pathname;
  const drafts = `${SITE_ROOT}/drafts/`;
  return window.location.pathname.startsWith(drafts) ? `${drafts}footer` : `${homePath()}footer`;
}

/**
 * loads and decorates the footer (footer fragment)
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const [fragment] = await Promise.all([loadFragment(footerPath()), loadPlaceholders()]);
  block.textContent = '';
  if (!fragment) return;

  // the <footer> element plays the prototype's footer.site-footer
  const footer = block.closest('footer');
  if (footer) footer.classList.add('site-footer');

  const inner = document.createElement('div');
  inner.className = 'site-footer__inner container';

  const logos = document.createElement('div');
  logos.className = 'site-footer__logos';
  [...fragment.querySelectorAll('img')].forEach((img, i) => {
    const mod = LOGO_MODS[i];
    const size = LOGO_SIZES[i] || [];
    logos.append(plainImg(img, mod ? `site-footer__logo--${mod}` : '', { width: size[0], height: size[1] }));
  });
  inner.append(logos);

  [...fragment.querySelectorAll('ul')].forEach((list, i) => {
    const nav = document.createElement('nav');
    if (NAV_CLASSES[i]) nav.className = NAV_CLASSES[i];
    if (NAV_LABELS[i]) nav.setAttribute('aria-label', t(...NAV_LABELS[i]));
    const ul = document.createElement('ul');
    ul.setAttribute('role', 'list');
    [...list.querySelectorAll(':scope > li')].forEach((li) => {
      const item = document.createElement('li');
      const a = li.querySelector('a');
      if (a) item.append(cleanLink(a));
      else item.textContent = li.textContent.trim();
      ul.append(item);
    });
    nav.append(ul);
    inner.append(nav);
  });

  block.append(inner);
}
