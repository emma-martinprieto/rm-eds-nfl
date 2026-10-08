import { toButton } from '../../scripts/nfl-utils.js';
import { icon } from '../../scripts/nfl-icons.js';
import initReveal from '../../scripts/reveal.js';
import initRowCarousel, { rowArrow } from '../../scripts/row-carousel.js';
import { loadPlaceholders, t } from '../../scripts/placeholders.js';

/* 06 · Planes Madridista (variant `planes`) — prototype index.html L237-289.
   Behaviour = js/script.js L330-413 (carrusel <1024, 4 columnas ≥1024).
   Rows in the order shown at every size (Platinum, Premium, Junior, Free).
   data-plan on each card: used by scripts/campaign-params.js. */

const DESKTOP = window.matchMedia('(min-width: 1024px)'); // --breakpoint-desktop

function buildPrice(p) {
  const price = document.createElement('p');
  price.className = 'plan__price';
  p.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'STRONG') {
      price.append(node.textContent); // el .plan__price ya es 700
    } else if (node.textContent.trim()) {
      const period = document.createElement('span');
      period.className = 'plan__period';
      period.textContent = node.textContent;
      price.append(period);
    }
  });
  return price;
}

function buildPlan(row) {
  const [styleCell, tagCell, bodyCell] = [...row.children];
  const style = styleCell ? styleCell.textContent.trim().toLowerCase() : '';
  const tagText = tagCell ? tagCell.textContent.trim() : '';

  const li = document.createElement('li');
  li.className = 'plan';
  if (style) li.classList.add(`plan--${style}`);

  if (tagText) {
    const tag = document.createElement('span');
    tag.className = `plan__tag${style === 'platinum' ? ' plan__tag--platinum' : ''}`;
    tag.textContent = tagText;
    li.append(tag);
  }
  if (!bodyCell) return li;

  const heading = bodyCell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const name = document.createElement('h3');
    name.className = 'plan__name';
    name.textContent = heading.textContent.trim();
    li.dataset.plan = name.textContent.toLowerCase();
    li.append(name);
  }

  const kids = [...bodyCell.children];
  const list = bodyCell.querySelector('ul, ol');
  const listIdx = list ? kids.indexOf(list) : kids.length;
  const paras = kids.filter((el) => el.tagName === 'P');
  const ctaP = [...paras].reverse().find((p) => p.querySelector('a'));
  const textParas = paras.filter((p) => p !== ctaP && kids.indexOf(p) < listIdx);
  const priceP = textParas.find((p) => p.querySelector('strong'));
  const rest = textParas.filter((p) => p !== priceP);
  const claimP = rest[rest.length - 1];

  if (priceP) li.append(buildPrice(priceP));
  rest.forEach((p) => {
    const el = document.createElement('p');
    el.className = p === claimP ? 'plan__claim' : 'plan__alt';
    el.textContent = p.textContent;
    li.append(el);
  });

  if (list) {
    const benefits = document.createElement('ul');
    benefits.className = 'plan__benefits';
    benefits.setAttribute('role', 'list');
    list.querySelectorAll(':scope > li').forEach((item) => {
      const b = document.createElement('li');
      b.append(icon('check', 'icon'), item.textContent);
      benefits.append(b);
    });
    li.append(benefits);
  }

  if (ctaP) {
    const cta = toButton(ctaP.querySelector('a'), 'primary');
    cta.classList.add('plan__cta');
    li.append(cta);
  }
  return li;
}

export default async function decorate(block) {
  if (!block.classList.contains('planes')) return;
  await loadPlaceholders();

  const plans = document.createElement('ul');
  plans.className = 'membership__plans';
  plans.setAttribute('role', 'list');
  [...block.children].forEach((row) => plans.append(buildPlan(row)));

  const track = document.createElement('div');
  track.className = 'membership__carousel row-carousel__track';
  track.id = 'planes';
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', t('plans-region', 'Planes Madridista'));
  track.tabIndex = 0;
  track.append(plans);

  // Carrusel <1024 (scripts/row-carousel.js); en desktop, 4 columnas sin scroll
  const prev = rowArrow('prev', t('plans-prev', 'Plan anterior'), track.id);
  const next = rowArrow('next', t('plans-next', 'Plan siguiente'), track.id);
  const slider = document.createElement('div');
  slider.className = 'membership__slider row-carousel';
  slider.append(prev, track, next);

  block.replaceChildren(slider);
  initRowCarousel({
    track, list: plans, prev, next, layout: DESKTOP,
  });

  // Cascada: título y, en desktop, cada tarjeta (en el orden en que se ven).
  // En móvil y tablet, el carrusel entero de una vez: la tarjeta que asoma no queda invisible.
  const section = block.closest('.section');
  const heads = section ? [...section.querySelectorAll(':scope > .default-content-wrapper')] : [];
  initReveal(() => [...heads, ...(DESKTOP.matches ? plans.children : [slider])], DESKTOP);
}
