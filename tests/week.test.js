import assert from 'node:assert/strict';
import test from 'node:test';

import { createNextWeek, getNextWeekMonday, toLocalDateKey } from '../assets/js/week.js';

test('a Monday targets the Monday of the following calendar week', () => {
  const result = getNextWeekMonday(new Date(2026, 8, 28, 9));
  assert.equal(toLocalDateKey(result), '2026-10-05');
});

test('a Sunday targets the following day', () => {
  const result = getNextWeekMonday(new Date(2026, 9, 4, 22));
  assert.equal(toLocalDateKey(result), '2026-10-05');
});

test('the next week crosses the year boundary correctly', () => {
  const week = createNextWeek(new Date(2026, 11, 28, 9));
  assert.equal(week.key, '2027-01-04');
  assert.deepEqual(week.days.map(day => day.date.getDate()), [4, 5, 6, 7, 8]);
});
