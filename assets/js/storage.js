import { STORAGE_KEY } from './config.js';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function createMenuStorage(storageBackend) {
  const getStorage = () => storageBackend ?? window.localStorage;

  function load() {
    try {
      const serialized = getStorage().getItem(STORAGE_KEY);
      if (!serialized) return { values: {}, error: null };

      const values = JSON.parse(serialized);
      if (!isRecord(values)) throw new TypeError('Los datos guardados no tienen el formato esperado.');
      return { values, error: null };
    } catch (error) {
      console.warn('No se pudieron leer los datos guardados.', error);
      return { values: {}, error };
    }
  }

  function save(fields) {
    const values = Object.fromEntries(
      fields.map(field => [field.dataset.field, field.dataset.value]),
    );

    try {
      getStorage().setItem(STORAGE_KEY, JSON.stringify(values));
      return { ok: true, error: null };
    } catch (error) {
      console.warn('No se pudieron guardar los cambios.', error);
      return { ok: false, error };
    }
  }

  function clear() {
    try {
      getStorage().removeItem(STORAGE_KEY);
      return { ok: true, error: null };
    } catch (error) {
      console.warn('No se pudieron eliminar los datos guardados.', error);
      return { ok: false, error };
    }
  }

  return { clear, load, save };
}
