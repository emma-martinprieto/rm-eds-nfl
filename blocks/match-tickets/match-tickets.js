import { plainImg, toButton, timeEl } from '../../scripts/nfl-utils.js';

/* 03 · Entradas del partido — prototype index.html L374-387 (article.match-card).
   Interaction: CSS hover only. External links get target/rel via toButton → externalize. */

const IMG_SIZES = [[584, 289], [281, 140]];
const IMG_CLASSES = ['match-card__img', 'match-card__teams'];

export default function decorate(block) {
  const [mediaRow, bodyRow] = [...block.children];

  const media = document.createElement('div');
  media.className = 'match-card__media';
  if (mediaRow) {
    [...mediaRow.querySelectorAll('img')].forEach((img, i) => {
      const size = IMG_SIZES[i] || [];
      media.append(plainImg(img, IMG_CLASSES[i] || '', { width: size[0], height: size[1] }));
    });
  }

  const body = document.createElement('div');
  body.className = 'match-card__body';
  if (bodyRow) {
    const heading = bodyRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const h3 = document.createElement('h3');
      h3.className = 'match-card__title';
      h3.textContent = heading.textContent.trim();
      body.append(h3);
    }
    const paras = [...bodyRow.querySelectorAll('p')];
    const links = paras.map((p) => p.querySelector('a')).filter(Boolean);
    paras.filter((p) => !p.querySelector('a')).forEach((p) => {
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
