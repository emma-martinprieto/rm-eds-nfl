import { plainImg, toButton, ensureId } from '../../scripts/nfl-utils.js';

/* 10 · CTA final — prototype index.html L464-478. The block element plays section.final-cta.
   Behaviour = js/script.js L451-569 (balón que aterriza en el césped). */

/* ─── Balón que aterriza — script.js L451-569 ─── */
function initBall(section) {
  const ball = section && section.querySelector('.final-cta__ball');
  const title = section && section.querySelector('.final-cta__title');
  const inner = section && section.querySelector('.final-cta__inner');
  if (!ball || !title || !inner || !('IntersectionObserver' in window)) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1024px)'); // --breakpoint-desktop

  const DURATION = 1200; // ms · móvil y tablet
  const DURATION_CROSS = 2200; // ms · desktop: diagonal de arriba-derecha a izquierda
  const FROM = 0.45; // móvil: entrada desde la derecha (fracción del ancho)
  const ARC = 160; // móvil: altura del arco (px)
  const GAP = 48; // separación con el título (px) — --spacing-xl
  const GAP_BOTTOM = 16; // separación con el botón y el borde abajo (px) — --spacing-base
  const MIN_SCALE = 0.5; // por debajo de esto no se muestra
  let landed = false;

  function tf(x, y, rot, scale) {
    return `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot}deg) scale(${scale.toFixed(3)})`;
  }

  // Hueco bajo el último elemento del contenido, pegado a un lado ('left' | 'right')
  function bottomSpot(side, w, h, sec, cStart, cEnd) {
    const last = inner.lastElementChild.getBoundingClientRect();
    const avail = sec.bottom - last.bottom - 2 * GAP_BOTTOM;
    const scale = Math.min(1, avail / h);
    if (scale < MIN_SCALE) return null;
    const vw = w * scale;
    const vh = h * scale; // el escalado es desde el centro: se compensa
    const x = (side === 'left' ? cStart : cEnd - vw) - sec.left - (w - vw) / 2;
    const y = last.bottom + GAP_BOTTOM + (avail - vh) / 2 - sec.top - (h - vh) / 2;
    return { x, y, scale };
  }

  function spot() {
    const w = ball.offsetWidth;
    const h = ball.offsetHeight;
    const sec = section.getBoundingClientRect();
    const container = title.closest('.container');
    const cRect = container.getBoundingClientRect();
    const cs = getComputedStyle(container);
    const cStart = cRect.left + parseFloat(cs.paddingLeft);
    const cEnd = cRect.right - parseFloat(cs.paddingRight);
    let s;

    if (desktop.matches) {
      // A la izquierda del título (texto real; el título va centrado)
      const range = document.createRange();
      range.selectNodeContents(title);
      const rects = range.getClientRects();
      let left = Infinity;
      for (let i = 0; i < rects.length; i += 1) left = Math.min(left, rects[i].left);
      if (left - cStart - 2 * GAP >= w) {
        const box = title.getBoundingClientRect();
        s = {
          x: left - GAP - w - sec.left, y: box.top + box.height / 2 - h / 2 - sec.top, scale: 1,
        };
      } else {
        s = bottomSpot('left', w, h, sec, cStart, cEnd);
      }
      if (s) s.mode = 'cross';
      return s;
    }

    s = bottomSpot('right', w, h, sec, cStart, cEnd);
    if (s) s.mode = 'bottom';
    return s;
  }

  function land() {
    if (landed || reduceMotion.matches) return;
    const s = spot();
    if (!s) return;
    landed = true;
    const k = s.scale;
    const w = ball.offsetWidth;
    const h = ball.offsetHeight;
    ball.style.transform = tf(s.x, s.y, 0, k);
    ball.style.opacity = 1;

    if (s.mode === 'cross') {
      // Arranca dentro de la sección, arriba a la derecha, ya visible a medias
      const fromX = section.clientWidth - w * 0.9;
      const fromY = -h * 0.1;
      const dx = s.x - fromX;
      const dy = s.y - fromY;
      ball.animate([
        { transform: tf(fromX, fromY, 150, 0.4 * k), opacity: 0.5 },
        {
          transform: tf(fromX + dx * 0.3, fromY + dy * 0.2, 110, 0.55 * k),
          opacity: 0.55,
          offset: 0.3,
        },
        {
          transform: tf(fromX + dx * 0.65, fromY + dy * 0.5, 60, 0.8 * k),
          opacity: 0.65,
          offset: 0.6,
        },
        {
          transform: tf(s.x, s.y, -8, 1.08 * k), opacity: 1, offset: 0.86,
        },
        { transform: tf(s.x, s.y - 18 * k, 4, k), offset: 0.93 },
        { transform: tf(s.x, s.y, 0, k), opacity: 1 },
      ], { duration: DURATION_CROSS, easing: 'ease-in-out' });
      return;
    }

    const from = section.clientWidth * FROM;
    ball.animate([
      { transform: tf(s.x + from, s.y - ARC / 2, -35, k), opacity: 0 },
      { transform: tf(s.x + from / 2, s.y - ARC, -10, k), opacity: 1, offset: 0.45 },
      { transform: tf(s.x, s.y, 0, k), offset: 0.8 },
      { transform: tf(s.x, s.y - 14 * k, 4, k), offset: 0.9 },
      { transform: tf(s.x, s.y, 0, k) },
    ], { duration: DURATION, easing: 'ease-out' });
  }

  // Si cambia el tamaño después de posarse, recoloca sin animar (o lo oculta si ya no cabe)
  window.addEventListener('resize', () => {
    if (!landed) return;
    const s = spot();
    if (s) ball.style.transform = tf(s.x, s.y, 0, s.scale);
    ball.style.opacity = s ? 1 : 0;
  });

  // Se dispara cuando el título está entero en pantalla (y no pegado al borde inferior):
  // así el recorrido ocurre a la vista
  new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      land();
      if (landed) observer.disconnect();
    }
  }, { threshold: 1, rootMargin: '0px 0px -15% 0px' }).observe(title);
}

function textP(p, className) {
  const el = document.createElement('p');
  el.className = className;
  el.textContent = p.textContent.trim();
  return el;
}

export default function decorate(block) {
  const [bgRow, mainRow, secondaryRow] = [...block.children];

  const bgImg = bgRow && bgRow.querySelector('img');
  const bg = bgImg ? plainImg(bgImg, 'final-cta__bg', { alt: '', width: 1333, height: 1200 }) : null;

  const ball = document.createElement('img');
  ball.className = 'final-cta__ball';
  ball.src = `${window.hlx.codeBasePath}/images/balon-nfl-madrid-game-2.webp`;
  ball.alt = '';
  ball.setAttribute('aria-hidden', 'true');
  ball.width = 498;
  ball.height = 388;
  ball.loading = 'lazy';

  const inner = document.createElement('div');
  inner.className = 'final-cta__inner container';

  if (mainRow) {
    const heading = mainRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.className = 'final-cta__title';
      h2.textContent = heading.textContent.trim();
      inner.append(h2);
    }
    mainRow.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a');
      inner.append(a ? toButton(a) : textP(p, 'final-cta__text'));
    });
  }

  if (secondaryRow) {
    const secondary = document.createElement('div');
    secondary.className = 'final-cta__secondary';
    let first = true;
    secondaryRow.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a');
      if (a) {
        secondary.append(toButton(a));
      } else {
        secondary.append(textP(p, first ? 'final-cta__question' : 'final-cta__text'));
        first = false;
      }
    });
    inner.append(secondary);
  }

  block.replaceChildren(...[bg, ball, inner].filter(Boolean));
  const title = inner.querySelector('.final-cta__title');
  if (title) block.setAttribute('aria-labelledby', ensureId(title));

  initBall(block);
}
