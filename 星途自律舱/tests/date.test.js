const test = require('node:test');
const assert = require('node:assert/strict');

const { formatDate, getRecentDates, isSameDay } = require('../utils/date');

test('formatDate returns YYYY-MM-DD using local date values', () => {
  const date = new Date(2026, 5, 10, 8, 30, 0);
  assert.equal(formatDate(date), '2026-06-10');
});

test('getRecentDates returns ordered dates ending at the provided date', () => {
  const end = new Date(2026, 5, 10);
  assert.deepEqual(getRecentDates(4, end), [
    '2026-06-07',
    '2026-06-08',
    '2026-06-09',
    '2026-06-10'
  ]);
});

test('isSameDay compares dates by calendar day', () => {
  assert.equal(isSameDay(new Date(2026, 5, 10, 1), new Date(2026, 5, 10, 23)), true);
  assert.equal(isSameDay(new Date(2026, 5, 10), new Date(2026, 5, 11)), false);
});
