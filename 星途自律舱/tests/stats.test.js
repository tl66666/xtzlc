const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDashboardStats } = require('../utils/stats');

const records = [
  { dimension: 'study', date: '2026-06-10', createdAt: '2026-06-10T10:00:00.000Z' },
  { dimension: 'sport', date: '2026-06-10', createdAt: '2026-06-10T11:00:00.000Z' },
  { dimension: 'diet', date: '2026-06-09', createdAt: '2026-06-09T08:00:00.000Z' },
  { dimension: 'study', date: '2026-06-08', createdAt: '2026-06-08T08:00:00.000Z' },
  { dimension: 'sleep', date: '2026-06-04', createdAt: '2026-06-04T08:00:00.000Z' }
];

test('buildDashboardStats aggregates today progress, week rate, heatmap, dimensions, and recent records', () => {
  const stats = buildDashboardStats(records, new Date(2026, 5, 10));

  assert.deepEqual(stats.today.completedDimensions.sort(), ['sport', 'study']);
  assert.equal(stats.today.completedCount, 2);
  assert.equal(stats.weekCompletionRate, 12);
  assert.equal(stats.dimensionCounts.study, 2);
  assert.equal(stats.dimensionCounts.sleep, 1);
  assert.equal(stats.heatmap.length, 30);
  assert.deepEqual(stats.heatmap.at(-1), { date: '2026-06-10', count: 2 });
  assert.deepEqual(stats.recentRecords.map((record) => record.dimension), ['sport', 'study', 'diet', 'study', 'sleep']);
});
