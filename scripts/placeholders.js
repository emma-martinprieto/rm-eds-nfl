/*
 * Textos de interfaz por idioma — hojas `placeholders` de DA (columnas Key y Text):
 * /placeholders (español) y /en/placeholders (inglés).
 * fetchPlaceholders is the boilerplate implementation (no longer shipped in aem.js).
 */
import { getMetadata, toCamelCase } from './aem.js';

const LOCALES = { es: 'es-ES', en: 'en-GB' };

/**
 * Idioma de la página: `en` bajo /en/; si no, `es`.
 * @returns {'es'|'en'}
 */
export function pageLanguage() {
  return /^\/en(\/|$)/.test(window.location.pathname) ? 'en' : 'es';
}

/** Ruta comparable: sin barra final ni index (/en/ = /en, /index = /). */
export function normalizePath(path) {
  return path.replace(/\/(index(\.html)?)?$/, '') || '/';
}

/** Portada del idioma: / o /en/. */
export function homePath(lang = pageLanguage()) {
  return lang === 'en' ? '/en/' : '/';
}

/** ¿Es la portada de su idioma? (las anclas del menú solo existen ahí) */
export function isHomePage() {
  return normalizePath(window.location.pathname) === normalizePath(homePath());
}

/**
 * Esta página en español y en inglés (hreflang y selector de idioma).
 * La otra versión: el metadato `Alternate Path` (ruta equivalente en el otro idioma, para
 * páginas cuya ruta no es igual en los dos, como las noticias); si no está, se calcula
 * cambiando solo el prefijo: /x ↔ /en/x (la portada: / ↔ /en/).
 * @returns {{es: string, en: string}}
 */
export function languagePaths() {
  const { origin, pathname } = window.location;
  const isEn = pageLanguage() === 'en';
  let alternate = getMetadata('alternate-path').trim();
  try {
    alternate = alternate ? new URL(alternate, origin).pathname : '';
  } catch (e) {
    alternate = '';
  }
  const autoEs = pathname.replace(/^\/en(\/|$)/, '/');
  return {
    es: (isEn && alternate) || (isEn ? autoEs : pathname),
    en: (!isEn && alternate) || (isEn ? pathname : `/en${autoEs}`),
  };
}

/**
 * Locale para Intl según el idioma de la página.
 * @returns {string} es-ES | en-GB
 */
export function pageLocale() {
  return LOCALES[pageLanguage()];
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          const placeholders = {};
          json.data
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[`${prefix}`];
}

let dictionary = {};
let loaded = false;

/**
 * Carga (una sola vez, compartida entre bloques) la hoja del idioma de la página.
 * Los bloques de más abajo la esperan antes de construir su marcado; t() la lee después.
 * @returns {Promise<object>}
 */
export async function loadPlaceholders() {
  dictionary = await fetchPlaceholders(pageLanguage() === 'en' ? '/en' : 'default');
  loaded = true;
  return dictionary;
}

/**
 * Primera pantalla (hero, cabecera, cuenta atrás): no espera a la hoja. Aplica los
 * textos ya (en español si aún no ha llegado) y otra vez cuando llega.
 * @param {Function} apply pone los textos con t()
 */
export function localize(apply) {
  apply();
  if (!loaded) loadPlaceholders().then(apply);
}

/**
 * Texto de interfaz. Si la clave no existe, está vacía o la hoja no cargó: el fallback.
 * @param {string} key clave de la hoja, tal cual (news-read-more)
 * @param {string} fallback texto en español
 * @param {object} [vars] valores para los huecos {nombre} del texto
 * @returns {string}
 */
export function t(key, fallback, vars = {}) {
  const value = dictionary[toCamelCase(key)];
  const text = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
