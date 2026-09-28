import { DAY_DEFINITIONS } from './config.js';

const PRICE_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;
const PERUVIAN_MOBILE_PATTERN = /^9\d{8}$/;

export function phoneDigits(value) {
  return String(value ?? '').replace(/[\s-]/g, '');
}

export function formatPeruvianMobile(value) {
  const digits = phoneDigits(value);
  if (!PERUVIAN_MOBILE_PATTERN.test(digits)) return null;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function isPositivePrice(value) {
  const normalized = String(value ?? '').trim();
  if (!PRICE_PATTERN.test(normalized)) return false;
  return Number(normalized.replace(',', '.')) > 0;
}

function isResolvedDay(day) {
  if (day?.status === 'no_classes') return true;
  return day?.status === 'menu' && Boolean(day.plato?.trim()) && Boolean(day.refresco?.trim());
}

export function evaluateShareReadiness(weekState, globalValues) {
  const missingDays = DAY_DEFINITIONS
    .filter(day => !isResolvedDay(weekState?.days?.[day.key]))
    .map(day => day.label);
  const missing = [];

  if (missingDays.length) missing.push(`configura ${missingDays.join(', ')}`);
  if (!isPositivePrice(globalValues.precio_menu)) missing.push('ingresa un precio de menú válido');
  if (!isPositivePrice(globalValues.precio_carta)) missing.push('ingresa un precio a la carta válido');
  if (!formatPeruvianMobile(globalValues.telefono)) missing.push('ingresa un celular peruano válido');

  return { ready: missing.length === 0, missing, missingDays };
}

export function createShareAvailabilityController({ button, description, getReadiness }) {
  function update() {
    const readiness = getReadiness();
    button.disabled = !readiness.ready;
    button.setAttribute('aria-disabled', String(!readiness.ready));

    if (readiness.ready) {
      description.textContent = 'El menú está completo y listo para compartir.';
      button.title = 'Compartir menú completo';
    } else {
      const explanation = `Para compartir: ${readiness.missing.join('; ')}.`;
      description.textContent = explanation;
      button.title = explanation;
    }

    return readiness;
  }

  return { getReadiness, update };
}
