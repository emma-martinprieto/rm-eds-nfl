/*
 * Iconos del prototipo (sprite de index.html L16-25), servidos como SVG inline
 * para conservar currentColor. `lock` y `user` no se portan (sin uso en el prototipo).
 */
const PATHS = {
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  'chevron-right': '<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>',
  'chevron-left': '<path d="M14 6l1.41 1.41L10.83 12l4.58 4.59L14 18l-6-6z" fill="currentColor"/>',
  'chevron-down': '<path d="M16.64 9.68 12 14.32 7.36 9.68" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
};

/**
 * Returns the inline SVG markup of a prototype icon.
 * @param {string} name icon name
 * @param {string} [className] class attribute (optional)
 * @returns {string} SVG markup
 */
export function iconSvg(name, className = '') {
  const cls = className ? ` class="${className}"` : '';
  return `<svg${cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[name] || ''}</svg>`;
}

/**
 * Returns a prototype icon as an SVG element.
 * @param {string} name icon name
 * @param {string} [className] class attribute (optional)
 * @returns {SVGElement}
 */
export function icon(name, className = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = iconSvg(name, className);
  return tpl.content.firstElementChild;
}
