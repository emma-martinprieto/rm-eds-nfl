/*
 * Parámetros de campaña en los enlaces de alta de los planes (botones .plan__cta del
 * carrusel de Planes). Solo esos enlaces: el resto (p. ej. «Participar» de Experiencias,
 * con su propio campaignId) no se toca.
 *
 * - Con ?campaignId y ?campaignChannel en la URL de la landing: ese campaignId y, como
 *   campaignChannel, el que llega + «-gl263-web-nfl-<plan>».
 * - Sin ellos: el campaignId por defecto y campaignChannel = «gl263-web-nfl-<plan>».
 * - ajo_action, ajo_journey y correlationId se añaden al final si llegan.
 *
 * Los parámetros se sustituyen donde estén: en la query (prelanding de Madridistas,
 * Platinum) o tras el # (SSO de signin.realmadrid.com, Premium, Junior y Free). El plan
 * sale de la tarjeta (su nombre o su variante), no del enlace.
 */
const DEFAULT_CAMPAIGN_ID = 'fd000cc3-bd2a-46dc-9bd6-5a51e9f930ca';
const CHANNEL_CODE = 'gl263';
const EXTRA_PARAMS = ['ajo_action', 'ajo_journey', 'correlationId'];
const PLANS = ['platinum', 'premium', 'junior', 'free'];

/** Sustituye name=… en cualquier parte del href (query o tras el #); si no está, lo añade. */
function setParam(href, name, value) {
  const encoded = encodeURIComponent(value);
  const regex = new RegExp(`([?&])${name}=[^&#]*`);
  if (regex.test(href)) return href.replace(regex, `$1${name}=${encoded}`);
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}${name}=${encoded}`;
}

/** Plan de la tarjeta: su nombre (data-plan) o su variante (plan--platinum…). */
function planOf(card) {
  const name = (card.dataset.plan || '').toLowerCase();
  return PLANS.find((plan) => name.includes(plan))
    || PLANS.find((plan) => card.classList.contains(`plan--${plan}`));
}

const params = new URLSearchParams(window.location.search);
const campaignId = params.get('campaignId') || DEFAULT_CAMPAIGN_ID;
const incomingChannel = params.get('campaignChannel');
const usedIds = new Set();

document.querySelectorAll('.plan .plan__cta[href]').forEach((link) => {
  const plan = planOf(link.closest('.plan'));
  if (!plan) return;

  // id de enganche (analítica): el primero de cada plan
  if (!usedIds.has(plan)) {
    link.id = `cta-${plan}`;
    usedIds.add(plan);
  }

  const tail = `${CHANNEL_CODE}-web-nfl-${plan}`;
  let href = link.getAttribute('href');
  href = setParam(href, 'campaignId', campaignId);
  href = setParam(href, 'campaignChannel', incomingChannel ? `${incomingChannel}-${tail}` : tail);

  EXTRA_PARAMS.forEach((name) => {
    const value = params.get(name);
    if (value) href = setParam(href, name, value);
  });

  link.setAttribute('href', href);
});
