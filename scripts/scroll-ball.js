/*
 * 12 · Balón decorativo · salida del vídeo — port of the prototype's js/script.js L577-636.
 * Ligada al scroll mientras se deja atrás el hero: el balón sale pequeño del vídeo,
 * salta en arco, crece como si viniera hacia la pantalla y se va por abajo a la derecha.
 * Todos los tamaños. Coordenadas de documento. Solo transform y opacity.
 * EDS: the prototype's `.hero` section is the `.hero.block` element.
 */
export default function initScrollBall(ball) {
  const hero = document.querySelector('.hero.block');
  if (!ball || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Gran salto: curva de Bézier en fracciones de la ventana
  const JUMP_FROM = { x: 0.64, y: 0.46 }; // dentro del vídeo, al fondo
  const JUMP_PEAK = { x: 0.52, y: -0.35 }; // punto de control: tira del arco hacia arriba
  const JUMP_TO = { x: 0.92, y: 1.15 }; // sale por abajo a la derecha
  const SCALE_FROM = 0.5; // pequeño, lejos…
  const SCALE_TO = 3.6; // …y enorme al final, como si viniera hacia la pantalla
  const SPIN = 200; // grados de giro durante el salto
  const INTRO_LENGTH = 0.8; // se completa al bajar el 80 % del alto del hero

  let ticking = false;

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
    const vx = vw * bezier(JUMP_FROM.x, JUMP_PEAK.x, JUMP_TO.x, t);
    const vy = vh * bezier(JUMP_FROM.y, JUMP_PEAK.y, JUMP_TO.y, t);
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

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  render();
}
