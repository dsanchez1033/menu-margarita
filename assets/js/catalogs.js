import { CATALOG_STORAGE_KEY } from './config.js';

export const CATALOG_TYPES = Object.freeze({
  platos: 'platos',
  refrescos: 'refrescos',
});

const CATALOG_URLS = Object.freeze({
  platos: new URL('../data/platos.json', import.meta.url).href,
  refrescos: new URL('../data/refrescos.json', import.meta.url).href,
});

const CATALOG_COLLATOR = new Intl.Collator('es-PE', {
  numeric: true,
  sensitivity: 'base',
});

export function normalizeCatalogValue(value) {
  return String(value).trim().replace(/\s+/g, ' ').normalize('NFC');
}

function comparisonKey(value) {
  return normalizeCatalogValue(value).toLocaleLowerCase('es-PE');
}

function normalizeList(values) {
  if (!Array.isArray(values)) throw new TypeError('El catálogo debe ser un array de textos.');
  const unique = new Map();
  values.forEach(value => {
    if (typeof value !== 'string') throw new TypeError('Cada opción del catálogo debe ser texto.');
    const normalized = normalizeCatalogValue(value);
    if (normalized && !unique.has(comparisonKey(normalized))) {
      unique.set(comparisonKey(normalized), normalized);
    }
  });
  return [...unique.values()].sort(CATALOG_COLLATOR.compare);
}

async function fetchCatalog(type) {
  const response = await fetch(CATALOG_URLS[type], { cache: 'no-cache' });
  if (!response.ok) throw new Error(`No se pudo cargar ${type}.json.`);
  return normalizeList(await response.json());
}

export async function loadBaseCatalogs() {
  const results = await Promise.allSettled([
    fetchCatalog(CATALOG_TYPES.platos),
    fetchCatalog(CATALOG_TYPES.refrescos),
  ]);
  const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
  return {
    catalogs: {
      platos: results[0].status === 'fulfilled' ? results[0].value : [],
      refrescos: results[1].status === 'fulfilled' ? results[1].value : [],
    },
    errors,
  };
}

function parseLocalCatalogs(serialized) {
  if (!serialized) return { platos: [], refrescos: [] };
  const parsed = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object') throw new TypeError('El catálogo local no es válido.');
  return {
    platos: normalizeList(parsed.platos || []),
    refrescos: normalizeList(parsed.refrescos || []),
  };
}

export function createCatalogRepository(baseCatalogs, storageBackend) {
  const getStorage = () => storageBackend ?? window.localStorage;
  let localCatalogs = { platos: [], refrescos: [] };
  let loadError = null;

  try {
    localCatalogs = parseLocalCatalogs(getStorage().getItem(CATALOG_STORAGE_KEY));
  } catch (error) {
    loadError = error;
    console.warn('No se pudieron leer las opciones locales.', error);
  }

  function persist() {
    try {
      getStorage().setItem(CATALOG_STORAGE_KEY, JSON.stringify(localCatalogs));
      return { ok: true, error: null };
    } catch (error) {
      console.warn('No se pudieron guardar las opciones locales.', error);
      return { ok: false, error };
    }
  }

  function list(type) {
    return normalizeList([...(baseCatalogs[type] || []), ...localCatalogs[type]]);
  }

  function listLocal(type) {
    return normalizeList(localCatalogs[type]);
  }

  function add(type, value) {
    const normalized = normalizeCatalogValue(value);
    if (!normalized) return { ok: false, value: '', error: new Error('La opción está vacía.') };

    const existing = list(type).find(item => comparisonKey(item) === comparisonKey(normalized));
    if (existing) return { ok: true, value: existing, error: null };

    localCatalogs[type].push(normalized);
    const result = persist();
    return { ...result, value: normalized };
  }

  function removeLocal(type, value) {
    const key = comparisonKey(value);
    localCatalogs[type] = localCatalogs[type].filter(item => comparisonKey(item) !== key);
    return persist();
  }

  return { add, list, listLocal, loadError, removeLocal };
}
