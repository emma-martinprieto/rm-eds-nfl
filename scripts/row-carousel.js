/*
 * Carrusel horizontal de tarjetas («Row Arrow») — compartido por Planes (carousel `planes`)
 * y Noticias (cards `news`). Prototype js/script.js L330-413.
 * Flechas que avanzan una tarjeta (la de anterior se oculta al principio y la de siguiente
 * al final), arrastre con ratón, deslizar con el dedo y teclado (scroll nativo del track,
 * enfocable), y scroll-snap a la tarjeta más cercana.
 * Estructura: .row-carousel >
 *   [.row-arrow--prev, .row-carousel__track > lista > tarjetas, .row-arrow--next].
 * CSS común en styles/styles.css («Carrusel horizontal»); el ancho de las tarjetas, en cada bloque.
 */
import { icon } from './nfl-icons.js';

/**
 * Flecha «Row Arrow» (oculta hasta que initRowCarousel decide).
 * @param {'prev'|'next'} dir
 * @param {string} label nombre accesible (texto oculto)
 * @param {string} controls id del track
 * @returns {HTMLButtonElement}
 */
export function rowArrow(dir, label, controls) {
  const btn = document.createElement('button');
  btn.className = `row-arrow row-arrow--${dir}`;
  btn.type = 'button';
  btn.setAttribute('aria-controls', controls);
  btn.hidden = true;
  const text = document.createElement('span');
  text.className = 'visually-hidden';
  text.textContent = label;
  btn.append(icon(dir === 'prev' ? 'chevron-left' : 'chevron-right', 'row-arrow__icon'), text);
  return btn;
}

/**
 * @param {object} opts
 * @param {HTMLElement} opts.track elemento con scroll horizontal (.row-carousel__track)
 * @param {HTMLElement} opts.list lista de tarjetas (sus hijos son las tarjetas)
 * @param {HTMLButtonElement} opts.prev
 * @param {HTMLButtonElement} opts.next
 * @param {MediaQueryList} [opts.layout] al cambiar, vuelve a la primera tarjeta
 * @returns {{ update: Function }}
 */
export default function initRowCarousel({
  track, list, prev, next, layout,
}) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function step() {
    const card = list.firstElementChild;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  }

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const scrollable = max > 1;
    track.classList.toggle('is-draggable', scrollable);
    // Enfocable (flechas del teclado) solo mientras es carrusel
    if (scrollable) track.tabIndex = 0;
    else track.removeAttribute('tabindex');
    prev.hidden = !scrollable || track.scrollLeft <= 1;
    next.hidden = !scrollable || track.scrollLeft >= max - 1;
  }

  // Al cruzar el breakpoint, sin recargar: empieza desde la primera tarjeta
  if (layout) {
    const onLayoutChange = () => {
      track.classList.remove('is-dragging');
      track.scrollTo({ left: 0, behavior: 'auto' });
      update();
    };
    if (layout.addEventListener) layout.addEventListener('change', onLayoutChange);
    else if (layout.addListener) layout.addListener(onLayoutChange);
  }

  function go(dir) {
    track.scrollBy({ left: dir * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setTimeout(update, 500); // por si el navegador no emite «scroll» al terminar
  }

  prev.addEventListener('click', () => { go(-1); });
  next.addEventListener('click', () => { go(1); });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  // Arrastre con ratón (el dedo usa el scroll nativo)
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

  // Tras un arrastre, que el clic no active un enlace o botón de la tarjeta
  track.addEventListener('click', (e) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  update();
  // EDS: the section is display:none while blocks decorate, so the first update() measures 0;
  // re-measure when the track gets its real size.
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
  return { update };
}
