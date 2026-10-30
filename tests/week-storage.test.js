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

test('menu and both no-lunch reasons survive a reload', () => {
  const storage = createMemoryStorage();
  const repository = createWeekStorage(storage);
  const state = repository.load('2026-10-05').state;
  state.days.lunes = { status: 'menu', plato: 'Ají de gallina', refresco: 'Piña' };
  state.days.martes = { status: 'no_classes', plato: '', refresco: '' };
  state.days.miercoles = { status: 'early_departure', plato: '', refresco: '' };
  assert.equal(repository.save(state).ok, true);

  const reloaded = repository.load('2026-10-05').state;
  assert.deepEqual(reloaded.days.lunes, state.days.lunes);
  assert.deepEqual(reloaded.days.martes, state.days.martes);
  assert.deepEqual(reloaded.days.miercoles, state.days.miercoles);
});

test('no-lunch reasons discard stale menu values on load', () => {
  const repository = createWeekStorage(createMemoryStorage());
  const state = repository.load('2026-10-05').state;
  for (const status of ['no_classes', 'early_departure']) {
    state.days.lunes = { status, plato: 'Pollo', refresco: 'Piña' };
    repository.save(state);
    assert.deepEqual(repository.load(state.weekStart).state.days.lunes, {
      status, plato: '', refresco: '',
    });
  }
});
