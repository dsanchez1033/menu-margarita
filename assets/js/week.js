import { DAY_DEFINITIONS } from './config.js';

const DAYS_IN_WEEK = 7;

function copyAtNoon(date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

export function addDays(date, amount) {
  const result = copyAtNoon(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function getNextWeekMonday(referenceDate = new Date()) {
  const date = copyAtNoon(referenceDate);
  const daysSinceMonday = (date.getDay() + 6) % DAYS_IN_WEEK;
  return addDays(date, DAYS_IN_WEEK - daysSinceMonday);
}

export function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createNextWeek(referenceDate = new Date()) {
  const monday = getNextWeekMonday(referenceDate);
  return {
    key: toLocalDateKey(monday),
    days: DAY_DEFINITIONS.map((definition, index) => ({
      ...definition,
      date: addDays(monday, index),
    })),
  };
}

export function formatAccessibleDate(date) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
