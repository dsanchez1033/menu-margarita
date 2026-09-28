import assert from 'node:assert/strict';
import test from 'node:test';

import { WEEK_STORAGE_KEY } from '../assets/js/config.js';
import { createWeekStorage } from '../assets/js/week-storage.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

test('a different target week starts empty', () => {
  const storage = createMemoryStorage({
    [WEEK_STORAGE_KEY]: JSON.stringify({
      weekStart: '2026-09-28',
      days: { lunes: { status: 'no_classes', plato: '', refresco: '' } },
    }),
  });
  const result = createWeekStorage(storage).load('2026-10-05');
  assert.equal(result.state.days.lunes.status, 'empty');
});

test('menu and no-classes states survive a reload', () => {
  const storage = createMemoryStorage();
  const repository = createWeekStorage(storage);
  const state = repository.load('2026-10-05').state;
  state.days.lunes = { status: 'menu', plato: 'Ají de gallina', refresco: 'Piña' };
  state.days.martes = { status: 'no_classes', plato: '', refresco: '' };
  assert.equal(repository.save(state).ok, true);

  const reloaded = repository.load('2026-10-05').state;
  assert.deepEqual(reloaded.days.lunes, state.days.lunes);
  assert.deepEqual(reloaded.days.martes, state.days.martes);
});
