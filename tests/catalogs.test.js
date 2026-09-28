import assert from 'node:assert/strict';
import test from 'node:test';

import { CATALOG_STORAGE_KEY } from '../assets/js/config.js';
import { createCatalogRepository } from '../assets/js/catalogs.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

test('custom options are normalized, persisted and removable', () => {
  const storage = createMemoryStorage();
  const repository = createCatalogRepository({
    platos: ['Pollo a la olla'],
    refrescos: ['Piña'],
  }, storage);

  const added = repository.add('platos', '  Ají   de gallina  ');
  assert.equal(added.value, 'Ají de gallina');
  assert.deepEqual(repository.list('platos'), ['Ají de gallina', 'Pollo a la olla']);
  assert.ok(storage.values.has(CATALOG_STORAGE_KEY));

  assert.equal(repository.removeLocal('platos', 'ají de gallina').ok, true);
  assert.deepEqual(repository.list('platos'), ['Pollo a la olla']);
});

test('an option already present in JSON is not duplicated locally', () => {
  const repository = createCatalogRepository({ platos: ['Cau cau'], refrescos: [] }, createMemoryStorage());
  const result = repository.add('platos', 'cau cau');
  assert.equal(result.value, 'Cau cau');
  assert.deepEqual(repository.listLocal('platos'), []);
});

test('published and custom options are sorted using Spanish alphabetical rules', () => {
  const repository = createCatalogRepository({
    platos: ['Tallarín saltado', 'arroz chaufa'],
    refrescos: ['Piña', 'Cebada'],
  }, createMemoryStorage());

  repository.add('platos', 'Ají de gallina');
  repository.add('refrescos', 'Maracuyá');

  assert.deepEqual(
    repository.list('platos'),
    ['Ají de gallina', 'arroz chaufa', 'Tallarín saltado'],
  );
  assert.deepEqual(repository.list('refrescos'), ['Cebada', 'Maracuyá', 'Piña']);
});
