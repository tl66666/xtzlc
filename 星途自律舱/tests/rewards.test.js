const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateCheckinReward,
  calculateDailyReward,
  getLevelInfo
} = require('../utils/rewards');

test('calculateCheckinReward gives every dimension a base starlight reward', () => {
  assert.equal(calculateCheckinReward({ dimension: 'study' }), 10);
});

test('calculateDailyReward adds a perfect-day bonus when all six dimensions are complete', () => {
  assert.equal(calculateDailyReward({ completedCount: 6, currentStreak: 3 }), 30);
});

test('calculateDailyReward adds a seven-day streak bonus on streak milestones', () => {
  assert.equal(calculateDailyReward({ completedCount: 3, currentStreak: 7 }), 80);
});

test('getLevelInfo returns current and next level progress', () => {
  assert.deepEqual(getLevelInfo(520), {
    level: 4,
    name: '山河星',
    threshold: 500,
    nextLevel: 5,
    nextName: '文明星',
    nextThreshold: 1000,
    progress: 4
  });
});
