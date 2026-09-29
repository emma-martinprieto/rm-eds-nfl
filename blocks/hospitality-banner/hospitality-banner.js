import { plainImg, toButton, ensureId } from '../../scripts/nfl-utils.js';

/* Paquetes Hospitality — prototype index.html L394-409 (article.hospitality).
   Interaction: CSS hover only. Helmets are decorative (aria-hidden container, alt=""). */

const HELMET_MODS = ['falcons', 'bengals'];
const HELMET_SIZES = [[600, 600], [600, 520]];

export default function decorate(block) {
  const [photoRow, helmetsRow, bodyRow] = [...block.children];

  const article = document.createElement('article');
  article.className = 'hospitality';

  const media = document.createElement('div');
  media.className = 'hospitality__media';
  const photo = photoRow && photoRow.querySelector('img');
  if (photo) media.append(plainImg(photo, 'hospitality__img', { width: 1400, height: 1400 }));
  article.append(media);

  const helmets = document.createElement('div');
  helmets.className = 'hospitality__helmets';
  helmets.setAttribute('aria-hidden', 'true');
  if (helmetsRow) {
    [...helmetsRow.querySelectorAll('img')].forEach((img, i) => {
      const mod = HELMET_MODS[i];
      const size = HELMET_SIZES[i] || [];
      helmets.append(plainImg(img, `hospitality__helmet${mod ? ` hospitality__helmet--${mod}` : ''}`, {
        alt: '', width: size[0], height: size[1],
      }));
    });
  }
  article.append(helmets);

  const body = document.createElement('div');
  body.className = 'hospitality__body';
  if (bodyRow) {
    const heading = bodyRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const h3 = document.createElement('h3');
      h3.className = 'hospitality__title';
      h3.textContent = heading.textContent.trim();
      body.append(h3);
    }
    const paras = [...bodyRow.querySelectorAll('p')];
    paras.filter((p) => !p.querySelector('a')).forEach((p) => {
      const lead = document.createElement('p');
      lead.className = 'hospitality__lead';
      lead.textContent = p.textContent.trim();
      body.append(lead);
    });
    const links = paras.map((p) => p.querySelector('a')).filter(Boolean);
    if (links.length) {
      const action = document.createElement('div');
      action.className = 'hospitality__action';
      links.forEach((a) => action.append(toButton(a)));
      body.append(action);
    }
  }
  article.append(body);

  block.replaceChildren(article);
  const title = article.querySelector('.hospitality__title');
  if (title) article.setAttribute('aria-labelledby', ensureId(title, 'hospitality-title'));
}
