/*
 * 12 · Balón decorativo · salida del logo NFL — port of the prototype's js/script.js L577-636.
 * Ligada al scroll mientras se deja atrás el hero: el balón sale pequeño del escudo NFL
 * de la cabecera, salta en arco, crece como si viniera hacia la pantalla y se va por
 * abajo a la derecha. Todos los tamaños. Coordenadas de documento. Solo transform y opacity.
 * EDS: the prototype's `.hero` section is the `.hero.block` element; the prototype's
 * `.site-header__logo--nfl` is the second logo of the header group, after Bernabéu
 * (see header.css).
 */
const NFL_LOGO = 'header .site-header__logos > .site-header__logo:nth-child(2)';

export default function initScrollBall(ball) {
  const hero = document.querySelector('.hero.block');
  if (!ball || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Gran salto: curva de Bézier en fracciones de la ventana
  const JUMP_FROM = { x: 0.64, y: 0.46 }; // solo hasta que se mide el escudo NFL
  const JUMP_PEAK = { x: 0.55, y: -0.05 }; // punto de control: arco suave, hacia la derecha
  const JUMP_TO = { x: 0.92, y: 1.15 }; // sale por abajo a la derecha
  const SCALE_FROM = 0.2; // del tamaño del escudo…
  const SCALE_TO = 3.6; // …y enorme al final, como si viniera hacia la pantalla
  const SPIN = 200; // grados de giro durante el salto
  const INTRO_LENGTH = 1.4; // se completa al bajar 1,4 veces el alto del hero

  let ticking = false;
  // Centro del escudo NFL en la ventana, con la cabecera en su sitio (arriba del todo)
  let origin = null;

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function bezier(a, c, b, t) { return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b; }

  function render() {
    ticking = false;
    if (reduceMotion.matches) return;

    const y = window.scrollY;
    const introEnd = hero.offsetHeight * INTRO_LENGTH;

    if (y <= 0 || y >= introEnd) {
      ball.classList.remove('is-jumping');
      ball.style.opacity = 0;
      return;
    }

    const t = clamp(y / introEnd);
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const from = origin || { x: vw * JUMP_FROM.x, y: vh * JUMP_FROM.y };
    const vx = bezier(from.x, vw * JUMP_PEAK.x, vw * JUMP_TO.x, t);
    const vy = bezier(from.y, vh * JUMP_PEAK.y, vh * JUMP_TO.y, t);
    // Crece cada vez más deprisa: sensación de venir hacia el espectador
    const scale = SCALE_FROM + (SCALE_TO - SCALE_FROM) * (t ** 1.6);
    const rot = -25 + SPIN * t;
    ball.classList.add('is-jumping');
    // aparece al instante de empezar a bajar y se desvanece al final del salto
    ball.style.opacity = Math.min(clamp(y / (vh * 0.04)), clamp((1 - t) / 0.2));
    ball.style.transform = `translate3d(${(vx - ball.offsetWidth / 2).toFixed(1)}px,${
      (y + vy - ball.offsetHeight / 2).toFixed(1)}px,0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
  }

  function request() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(render);
    }
  }

  /* ─── Punto de salida: el escudo NFL ───
     La cabecera es fija (top: 0), así que su sitio natural es el mismo en la ventana
     que en el documento con scroll 0. Se suma offsetLeft/offsetTop hasta la cabecera:
     no cuentan los transform, así que no influye que esté escondida (translateY(-100%)).
     Compactada (--scrolled) tiene menos padding: esa medida vale de momento y se
     repite cuando vuelve a su tamaño natural. */
  function measure(logo) {
    if (!logo.offsetWidth) return;
    let x = logo.offsetWidth / 2;
    let top = logo.offsetHeight / 2;
    for (let el = logo; el; el = el.offsetParent) {
      x += el.offsetLeft;
      top += el.offsetTop;
    }
    origin = { x, y: top };
    request();
  }

  function track(logo) {
    const header = logo.closest('header');
    const inner = logo.closest('.site-header__inner');
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => measure(logo));
    };
    const compact = () => header && header.classList.contains('site-header--scrolled');

    window.addEventListener('resize', schedule);
    // Tamaño real (CSS de la cabecera, carga de la imagen, cambio de escala)
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(logo);
    // Fin de la transición de padding al volver arriba: ya está en su sitio natural
    if (inner) {
      inner.addEventListener('transitionend', (e) => {
        if (e.target === inner && !compact()) schedule();
      });
    }
    schedule();
  }

  // La cabecera de EDS se monta de forma asíncrona: espera a que el escudo exista
  const logo = document.querySelector(NFL_LOGO);
  if (logo) {
    track(logo);
  } else {
    const header = document.querySelector('body > header') || document.body;
    const observer = new MutationObserver(() => {
      const found = document.querySelector(NFL_LOGO);
      if (!found) return;
      observer.disconnect();
      track(found);
    });
    observer.observe(header, { childList: true, subtree: true });
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  render();
}
