import { toButton } from '../../scripts/nfl-utils.js';
import { icon } from '../../scripts/nfl-icons.js';

/* 06 · Planes Madridista (variant `planes`) — prototype index.html L237-289.
   Behaviour = js/script.js L330-413 (carrusel <1024, 3 columnas ≥1024).
   This is the only carousel of the site; the boilerplate slide carousel is not used. */

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

function arrow(dir) {
  const btn = document.createElement('button');
  btn.className = `row-arrow row-arrow--${dir}`;
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'planes');
  btn.hidden = true;
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  label.textContent = dir === 'prev' ? 'Plan anterior' : 'Plan siguiente';
  btn.append(icon(dir === 'prev' ? 'chevron-left' : 'chevron-right', 'row-arrow__icon'), label);
  return btn;
}

/* ─── Carrusel — script.js L330-413 ─── */
function initSlider(slider) {
  const track = slider.querySelector('.membership__carousel');
  const prev = slider.querySelector('.row-arrow--prev');
  const next = slider.querySelector('.row-arrow--next');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function step() {
    const card = track.querySelector('.plan');
    const gap = parseFloat(getComputedStyle(track.querySelector('.membership__plans')).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  }

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const scrollable = max > 1;
    track.classList.toggle('is-draggable', scrollable);
    prev.hidden = !scrollable || track.scrollLeft <= 1;
    next.hidden = !scrollable || track.scrollLeft >= max - 1;
  }

  function go(dir) {
    track.scrollBy({ left: dir * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setTimeout(update, 500); // por si el navegador no emite «scroll» al terminar
  }

  prev.addEventListener('click', () => { go(-1); });
  next.addEventListener('click', () => { go(1); });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  // Arrastre con ratón
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;
  let suppressClick = false;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !track.classList.contains('is-draggable')) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (moved) track.scrollLeft = startScroll - dx;
  });

  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    // Al soltar: con más de 50 px de arrastre pasa a la tarjeta siguiente/anterior
    const size = step();
    const from = Math.round(startScroll / size);
    const dx = e.clientX - startX;
    let index = from;
    if (Math.abs(dx) > 50) index = from + (dx < 0 ? 1 : -1);
    track.classList.remove('is-dragging');
    track.scrollTo({ left: index * size, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setTimeout(update, 500);
    // Bloquea solo el clic que el navegador dispara justo al soltar
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
  });

  // Evita el «arrastrar enlace» nativo del navegador sobre los botones
  track.addEventListener('dragstart', (e) => { e.preventDefault(); });

  // Tras un arrastre, que el clic no active un botón de la tarjeta
  track.addEventListener('click', (e) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  update();
  // EDS: the section is display:none while blocks decorate, so the first update() measures 0;
  // re-measure when the track gets its real size (no visible change vs. the prototype).
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
}

export default function decorate(block) {
  const plans = document.createElement('ul');
  plans.className = 'membership__plans';
  plans.setAttribute('role', 'list');
  [...block.children].forEach((row) => plans.append(buildPlan(row)));

  const track = document.createElement('div');
  track.className = 'membership__carousel';
  track.id = 'planes';
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', 'Planes Madridista');
  track.tabIndex = 0;
  track.append(plans);

  const slider = document.createElement('div');
  slider.className = 'membership__slider';
  slider.append(arrow('prev'), track, arrow('next'));

  block.replaceChildren(slider);
  initSlider(slider);
}
