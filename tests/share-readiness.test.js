import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateShareReadiness,
  formatPeruvianMobile,
  isPositivePrice,
} from '../assets/js/share-readiness.js';

const completeDays = {
  lunes: { status: 'menu', plato: 'Ají de gallina', refresco: 'Piña' },
  martes: { status: 'no_classes', plato: '', refresco: '' },
  miercoles: { status: 'menu', plato: 'Cau cau', refresco: 'Cebada' },
  jueves: { status: 'menu', plato: 'Lomo saltado', refresco: 'Jamaica' },
  viernes: { status: 'menu', plato: 'Pollo a la olla', refresco: 'Limonada' },
};

test('a Peruvian mobile number is validated and formatted in groups of three', () => {
  assert.equal(formatPeruvianMobile('923456789'), '923 456 789');
  assert.equal(formatPeruvianMobile('923-456-789'), '923 456 789');
  assert.equal(formatPeruvianMobile('823456789'), null);
  assert.equal(formatPeruvianMobile('923 XXX XXX'), null);
});

test('prices must be positive numeric values and may use a decimal comma', () => {
  assert.equal(isPositivePrice('11'), true);
  assert.equal(isPositivePrice('11,50'), true);
  assert.equal(isPositivePrice('0'), false);
  assert.equal(isPositivePrice('S/ 11'), false);
});

test('sharing is ready when five days, both prices and the phone are complete', () => {
  const result = evaluateShareReadiness(
    { days: completeDays },
    { precio_menu: '11', precio_carta: '14', telefono: '923 456 789' },
  );

  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
});

test('empty days and invalid global values explain why sharing is unavailable', () => {
  const days = { ...completeDays, viernes: { status: 'empty', plato: '', refresco: '' } };
  const result = evaluateShareReadiness(
    { days },
    { precio_menu: '0', precio_carta: '', telefono: 'XXX XXX XXX' },
  );

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingDays, ['Viernes']);
  assert.equal(result.missing.length, 4);
});
