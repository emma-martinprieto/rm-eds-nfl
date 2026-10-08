import { plainImg, toButton, timeEl } from '../../scripts/nfl-utils.js';
import { loadPlaceholders } from '../../scripts/placeholders.js';

/* 03 · Entradas del partido — banner (Figma 7770-1363).
   Row 1: photo | players cut-out. Row 2: crests (own paragraph or inside the
   heading) + heading + meta + links. Interaction: CSS hover only.
   External links get target/rel via toButton → externalize. */

const MEDIA_CLASSES = ['match-card__img', 'match-card__players'];

// Keeps the authored intrinsic size (width/height) to avoid layout shift
const toImg = (img, className) => plainImg(img, className, {
  width: img.getAttribute('width'),
  height: img.getAttribute('height'),
});

export default async function decorate(block) {
  await loadPlaceholders(); // toButton: «se abre en una pestaña nueva» en el idioma de la página
  const [mediaRow, bodyRow] = [...block.children];

  const media = document.createElement('div');
  media.className = 'match-card__media';
  if (mediaRow) {
    [...mediaRow.querySelectorAll('img')].forEach((img, i) => {
      media.append(toImg(img, MEDIA_CLASSES[i] || ''));
    });
  }

  const body = document.createElement('div');
  body.className = 'match-card__body';
  if (bodyRow) {
    // Crests: first image of the row, wherever the author put it
    const crests = bodyRow.querySelector('img');
    if (crests) body.append(toImg(crests, 'match-card__teams'));

    const heading = bodyRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && heading.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.className = 'match-card__title';
      h3.textContent = heading.textContent.trim();
      body.append(h3);
    }
    const paras = [...bodyRow.querySelectorAll('p')];
    const links = paras.map((p) => p.querySelector('a')).filter(Boolean);
    paras.filter((p) => !p.querySelector('a') && p.textContent.trim()).forEach((p) => {
      // meta: <time> = everything before the LAST " · " (the venue stays outside)
      const text = p.textContent.trim();
      const meta = document.createElement('p');
      meta.className = 'match-card__meta';
      const idx = text.lastIndexOf(' · ');
      if (idx > 0) meta.append(timeEl(text.slice(0, idx)), text.slice(idx));
      else meta.textContent = text;
      body.append(meta);
    });
    if (links.length) {
      const action = document.createElement('div');
      action.className = 'match-card__action btn-pair';
      links.forEach((a) => action.append(toButton(a)));
      body.append(action);
    }
  }

  const article = document.createElement('article');
  article.className = 'match-card';
  article.append(media, body);
  block.replaceChildren(article);
}
