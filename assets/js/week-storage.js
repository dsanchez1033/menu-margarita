import { DAY_DEFINITIONS, WEEK_STORAGE_KEY } from './config.js';

const VALID_STATUSES = new Set(['empty', 'menu', 'no_classes']);

function emptyDay() {
  return { status: 'empty', plato: '', refresco: '' };
}

export function createEmptyWeek(weekStart) {
  return {
    weekStart,
    days: Object.fromEntries(DAY_DEFINITIONS.map(day => [day.key, emptyDay()])),
  };
}

function normalizeDay(value) {
  if (!value || typeof value !== 'object' || !VALID_STATUSES.has(value.status)) {
    return emptyDay();
  }
  if (value.status === 'menu') {
    const plato = typeof value.plato === 'string' ? value.plato.trim() : '';
    const refresco = typeof value.refresco === 'string' ? value.refresco.trim() : '';
    return plato && refresco ? { status: 'menu', plato, refresco } : emptyDay();
  }
  if (value.status === 'no_classes') {
    return { status: 'no_classes', plato: '', refresco: '' };
  }
  return emptyDay();
}

export function createWeekStorage(storageBackend) {
  const getStorage = () => storageBackend ?? window.localStorage;

  function load(weekStart) {
    const fallback = createEmptyWeek(weekStart);
    try {
      const serialized = getStorage().getItem(WEEK_STORAGE_KEY);
      if (!serialized) return { state: fallback, error: null };

      const parsed = JSON.parse(serialized);
      if (!parsed || parsed.weekStart !== weekStart || typeof parsed.days !== 'object') {
        return { state: fallback, error: null };
      }

      const days = Object.fromEntries(DAY_DEFINITIONS.map(day => [
        day.key,
        normalizeDay(parsed.days[day.key]),
      ]));
      return { state: { weekStart, days }, error: null };
    } catch (error) {
      console.warn('No se pudo leer el menú semanal guardado.', error);
      return { state: fallback, error };
    }
  }

  function save(state) {
    try {
      getStorage().setItem(WEEK_STORAGE_KEY, JSON.stringify(state));
      return { ok: true, error: null };
    } catch (error) {
      console.warn('No se pudo guardar el menú semanal.', error);
      return { ok: false, error };
    }
  }

  function clear() {
    try {
      getStorage().removeItem(WEEK_STORAGE_KEY);
      return { ok: true, error: null };
    } catch (error) {
      console.warn('No se pudo borrar el menú semanal.', error);
      return { ok: false, error };
    }
  }

  return { clear, load, save };
}
