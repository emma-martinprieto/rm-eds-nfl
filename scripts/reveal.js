/* Aparición en cascada al entrar en la sección — prototype js/script.js L273-322.
   Used by Experiencias, Planes and Noticias. The .reveal / .is-visible styles live in
   styles/styles.css; without JS, or with reduced motion, everything is visible from the start. */

const STAGGER = 90; // ms entre un elemento y el siguiente
const MAX_DELAY = 450; // ms, tope del escalonado

function done(event) {
  const el = event.currentTarget;
  // transitionend sube desde los hijos (botones con `transition: all`): solo cuenta el propio
  if (event.target !== el || event.propertyName !== 'opacity') return;
  el.removeEventListener('transitionend', done);
  el.classList.remove('reveal', 'is-visible');
  el.style.removeProperty('--reveal-delay');
}

function clear(el) {
  el.removeEventListener('transitionend', done);
  el.style.removeProperty('--reveal-delay');
  el.classList.remove('reveal', 'is-visible');
}

// Fuera de pantalla por abajo: se deja listo para volver a entrar
function reset(el) {
  clear(el);
  el.classList.add('reveal');
}

// Orden en pantalla: de arriba abajo y, en la misma fila, de izquierda a derecha
// (no el del DOM, por si el CSS recoloca elementos)
function byPosition(a, b) {
  const ra = a.boundingClientRect;
  const rb = b.boundingClientRect;
  return Math.abs(ra.top - rb.top) > 1 ? ra.top - rb.top : ra.left - rb.left;
}

/**
 * @param {() => Element[]} getItems the elements that appear, one after another
 * @param {MediaQueryList|MediaQueryList[]} [layout] when one changes, getItems() is asked again
 */
export default function initReveal(getItems, layout) {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    const entering = [];
    entries.forEach((entry) => {
      const el = entry.target;
      if (!entry.isIntersecting) {
        const bottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight;
        if (entry.boundingClientRect.top >= bottom) reset(el);
        return;
      }
      if (el.classList.contains('reveal') && !el.classList.contains('is-visible')) entering.push(entry);
    });

    entering.sort(byPosition).forEach((entry, step) => {
      const el = entry.target;
      // Variable y no transition-delay: el retardo no alcanza a otras transiciones (sombra)
      el.style.setProperty('--reveal-delay', `${Math.min(step * STAGGER, MAX_DELAY)}ms`);
      el.addEventListener('transitionend', done);
      el.classList.add('is-visible');
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  let items = [];

  function observe(initial) {
    items = getItems().filter(Boolean);
    items.forEach((el) => {
      // Tras un cambio de layout, lo que ya está en pantalla o por encima no vuelve a aparecer
      if (initial || el.getBoundingClientRect().top >= window.innerHeight) el.classList.add('reveal');
      observer.observe(el);
    });
  }

  observe(true);

  if (layout) {
    const onChange = () => {
      items.forEach((el) => {
        observer.unobserve(el);
        clear(el);
      });
      observe(false);
    };
    [].concat(layout).forEach((mq) => {
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    });
  }
}
