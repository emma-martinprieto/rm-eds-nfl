import { createOptimizedPicture } from '../../scripts/aem.js';
import { plainImg, cleanLink, timeEl } from '../../scripts/nfl-utils.js';

/* ─── Variant `flip` · 08 · Noticias — prototype index.html L306-361.
   Behaviour = js/script.js L420-439 (tarjetas que giran). ─── */

function flip(card, toBack) {
  const front = card.querySelector('.news-card__front');
  const back = card.querySelector('.news-card__back');
  card.classList.toggle('is-flipped', toBack);
  front.inert = toBack;
  back.inert = !toBack;
  card.querySelector('.news-card__front .news-card__flip').setAttribute('aria-expanded', String(toBack));
  (toBack ? back.querySelector('.news-card__link') : front.querySelector('.news-card__flip')).focus({ preventScroll: true });
}

function dateP(text) {
  const p = document.createElement('p');
  p.className = 'news-card__date';
  p.append(timeEl(text));
  return p;
}

function buildNewsCard(row, n) {
  const [imgCell, frontCell, backCell] = [...row.children];
  const frontId = `noticia-${n}-frente`;
  const backId = `noticia-${n}-detras`;

  const heading = frontCell && frontCell.querySelector('h1, h2, h3, h4, h5, h6');
  const titleText = heading ? heading.textContent.trim() : '';
  const frontParas = frontCell ? [...frontCell.querySelectorAll(':scope > p')] : [];
  const kids = frontCell ? [...frontCell.children] : [];
  const hIdx = heading ? kids.indexOf(heading) : -1;
  const dateText = (frontParas.find((p) => kids.indexOf(p) < hIdx) || { textContent: '' }).textContent.trim();
  const teaserP = frontParas.find((p) => kids.indexOf(p) > hIdx);

  // anverso
  const front = document.createElement('div');
  front.className = 'news-card__face news-card__front';
  front.id = frontId;
  const img = imgCell && imgCell.querySelector('img');
  if (img) front.append(plainImg(img, 'news-card__media'));
  if (dateText) front.append(dateP(dateText));
  const h3 = document.createElement('h3');
  h3.className = 'news-card__title';
  h3.textContent = titleText;
  front.append(h3);
  if (teaserP) {
    const teaser = document.createElement('p');
    teaser.className = 'news-card__teaser';
    teaser.textContent = teaserP.textContent.trim();
    front.append(teaser);
  }
  const more = document.createElement('button');
  more.className = 'news-card__flip';
  more.type = 'button';
  more.setAttribute('aria-controls', backId);
  more.setAttribute('aria-expanded', 'false');
  const moreHidden = document.createElement('span');
  moreHidden.className = 'visually-hidden';
  moreHidden.textContent = `: ${titleText}`;
  more.append('Leer más', moreHidden);
  front.append(more);

  // reverso (fecha y título duplicados del anverso, como en el prototipo)
  const back = document.createElement('div');
  back.className = 'news-card__face news-card__back';
  back.id = backId;
  back.inert = true;
  if (dateText) back.append(dateP(dateText));
  const backTitle = document.createElement('p');
  backTitle.className = 'news-card__back-title';
  backTitle.textContent = titleText;
  back.append(backTitle);
  const backParas = backCell ? [...backCell.querySelectorAll(':scope > p')] : [];
  backParas.forEach((p) => {
    const a = p.querySelector('a');
    if (a) {
      back.append(cleanLink(a, 'news-card__link'));
    } else {
      const text = document.createElement('p');
      text.className = 'news-card__text';
      text.textContent = p.textContent.trim();
      back.append(text);
    }
  });
  const volver = document.createElement('button');
  volver.className = 'news-card__flip news-card__flip--back';
  volver.type = 'button';
  volver.setAttribute('aria-controls', frontId);
  volver.textContent = 'Volver';
  back.append(volver);

  const inner = document.createElement('div');
  inner.className = 'news-card__inner';
  inner.append(front, back);

  const li = document.createElement('li');
  li.className = 'news-card';
  li.append(inner);

  more.addEventListener('click', () => { flip(li, true); });
  volver.addEventListener('click', () => { flip(li, false); });
  return li;
}

function decorateFlip(block) {
  const ul = document.createElement('ul');
  ul.className = 'news__grid';
  ul.setAttribute('role', 'list');
  [...block.children].forEach((row, i) => ul.append(buildNewsCard(row, i + 1)));
  block.replaceChildren(ul);
}

/* ─── Standard Block Collection cards ─── */
export default function decorate(block) {
  if (block.classList.contains('flip')) {
    decorateFlip(block);
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
