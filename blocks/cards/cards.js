import { createOptimizedPicture } from '../../scripts/aem.js';
import { plainImg } from '../../scripts/nfl-utils.js';
import { icon } from '../../scripts/nfl-icons.js';
import initReveal from '../../scripts/reveal.js';
import initRowCarousel, { rowArrow } from '../../scripts/row-carousel.js';
import initNewsLightbox from '../../scripts/news-lightbox.js';
import { loadPlaceholders, t } from '../../scripts/placeholders.js';

/* ─── Variant `news` · 08 · Noticias ───
   Carrusel horizontal de tarjetas (scripts/row-carousel.js, también en desktop) y
   lightbox con la noticia al pulsar «Leer más» (scripts/news-lightbox.js).
   Una fila por noticia:
   foto | categoría + titular (encabezado) + entradilla | enlace a la página de la noticia. */

const TABLET = window.matchMedia('(min-width: 768px)'); // --breakpoint-tablet
const DESKTOP = window.matchMedia('(min-width: 1024px)'); // --breakpoint-desktop

function textP(className, text) {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
}

function buildNewsCard(row) {
  const [imgCell, textCell, linkCell] = [...row.children];
  const li = document.createElement('li');
  li.className = 'news-card';

  const img = imgCell && imgCell.querySelector('img');
  if (img) li.append(plainImg(img, 'news-card__media'));

  // Texto: lo de antes del encabezado es la categoría; lo de después, la entradilla
  const kids = textCell ? [...textCell.children] : [];
  const heading = kids.find((el) => /^H[1-6]$/.test(el.tagName));
  const hIdx = heading ? kids.indexOf(heading) : -1;
  const paras = kids.filter((el) => el.tagName === 'P' && el.textContent.trim());
  const categoryP = heading ? paras.find((p) => kids.indexOf(p) < hIdx) : paras[0];
  const teaserP = heading ? paras.find((p) => kids.indexOf(p) > hIdx) : paras[1];
  const category = categoryP ? categoryP.textContent.trim() : '';
  const title = heading ? heading.textContent.trim() : '';

  if (category) li.append(textP('news-card__category', category));
  if (title) {
    const h3 = document.createElement('h3');
    h3.className = 'news-card__title';
    h3.textContent = title;
    li.append(h3);
  }
  if (teaserP) li.append(textP('news-card__teaser', teaserP.textContent.trim()));

  // «Leer más ›»: enlace real a la página de la noticia (el lightbox lo intercepta)
  const a = (linkCell && linkCell.querySelector('a')) || (textCell && textCell.querySelector('a'));
  if (a && a.getAttribute('href')) {
    const more = document.createElement('a');
    more.className = 'news-card__more';
    more.href = a.getAttribute('href');
    if (category) more.dataset.category = category;
    const hidden = document.createElement('span');
    hidden.className = 'visually-hidden';
    hidden.textContent = title ? `: ${title}` : '';
    more.append(t('news-read-more', 'Leer más'), hidden, icon('chevron-right', 'icon'));
    li.append(more);
  }
  return li;
}

function decorateNews(block) {
  const list = document.createElement('ul');
  list.className = 'news__list';
  list.setAttribute('role', 'list');
  [...block.children].forEach((row) => list.append(buildNewsCard(row)));

  const track = document.createElement('div');
  track.className = 'news__track row-carousel__track';
  track.id = 'noticias-carrusel'; // no «noticias»: puede ser el ancla de la sección
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', t('news-region', 'Últimas noticias'));
  track.tabIndex = 0;
  track.append(list);

  const prev = rowArrow('prev', t('news-prev', 'Noticia anterior'), track.id);
  const next = rowArrow('next', t('news-next', 'Noticia siguiente'), track.id);
  const slider = document.createElement('div');
  slider.className = 'news__slider row-carousel';
  slider.append(prev, track, next);
  block.replaceChildren(slider);

  initRowCarousel({
    track, list, prev, next,
  });
  initNewsLightbox(list.querySelectorAll('.news-card__more'));

  // Cascada: título y las tarjetas que se ven enteras (3 desktop · 2 tablet · 1 móvil).
  // La que asoma no se anima: con tan poco a la vista, no llegaría a «entrar» y quedaría oculta.
  const section = block.closest('.section');
  const heads = section ? [...section.querySelectorAll(':scope > .default-content-wrapper')] : [];
  const visible = () => {
    if (DESKTOP.matches) return 3;
    return TABLET.matches ? 2 : 1;
  };
  initReveal(() => [...heads, ...[...list.children].slice(0, visible())], [TABLET, DESKTOP]);
}

/* ─── Standard Block Collection cards ─── */
export default async function decorate(block) {
  await loadPlaceholders();
  if (block.classList.contains('news')) {
    decorateNews(block);
    return;
  }
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
