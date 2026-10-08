import {
  toButton, ensureId, timeEl,
} from '../../scripts/nfl-utils.js';

/* 01 · Hero — prototype index.html L47-66; behaviour = js/script.js L71-107.
   The block element plays section.hero. */

function isVideoLink(a) {
  try {
    return /\.mp4$/i.test(new URL(a.href, window.location.href).pathname);
  } catch (e) {
    return false;
  }
}

/* Vídeo de fondo — script.js L71-107 */
function bindVideo(video) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Si el usuario activa movimiento reducido con la página abierta, se pausa
  const onMotionChange = (e) => { if (e.matches) video.pause(); };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
  else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);

  if (!reduceMotion.matches) {
    const promise = video.play();
    // Si el navegador bloquea el autoplay, se queda el póster
    if (promise && promise.catch) promise.catch(() => {});
  }
}

export default function decorate(block) {
  const poster = block.querySelector('img');
  const videoLink = [...block.querySelectorAll('a[href]')].find(isVideoLink);
  const title = block.querySelector('h1, h2');

  // text: every <p> of the text row that is not the media row
  const textCell = title ? title.parentElement : null;
  const paras = textCell ? [...textCell.querySelectorAll(':scope > p')] : [];
  const ctaP = paras.find((p) => p.querySelector('a'));
  const textParas = paras.filter((p) => p !== ctaP);

  // media
  const media = document.createElement('div');
  media.className = 'hero__media';
  const video = document.createElement('video');
  video.className = 'hero__video';
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'metadata');
  if (poster) video.setAttribute('poster', poster.src);
  video.setAttribute('aria-hidden', 'true');
  // EDS: an attribute created by JS does not set the `muted` property; required for autoplay
  video.muted = true;
  if (videoLink) {
    const source = document.createElement('source');
    source.src = videoLink.href;
    source.type = 'video/mp4';
    video.append(source);
  }
  media.append(video);

  // content
  const content = document.createElement('div');
  content.className = 'hero__content container';
  if (title) {
    const h1 = document.createElement(title.tagName.toLowerCase());
    h1.className = 'hero__title';
    h1.id = title.id || '';
    h1.textContent = title.textContent.trim();
    content.append(h1);
  }
  textParas.forEach((p, i) => {
    const el = document.createElement('p');
    if (i === 0) {
      el.className = 'hero__info';
      el.append(timeEl(p.textContent.trim()));
    } else {
      el.className = 'hero__lead';
      el.textContent = p.textContent.trim();
    }
    content.append(el);
  });
  if (ctaP) {
    const actions = document.createElement('div');
    actions.className = 'hero__actions';
    ctaP.querySelectorAll('a').forEach((a) => actions.append(toButton(a)));
    content.append(actions);
  }

  block.replaceChildren(media, content);
  const h = content.querySelector('.hero__title');
  if (h) block.setAttribute('aria-labelledby', ensureId(h));

  bindVideo(video);
}
