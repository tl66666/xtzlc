const test = require('node:test');
const assert = require('node:assert/strict');

const { getUnlockedAchievements } = require('../utils/achievements');

test('getUnlockedAchievements unlocks first check-in and perfect day once', () => {
  const unlocked = getUnlockedAchievements(
    { totalStarlight: 90, currentStreak: 1 },
    { totalCheckins: 6, perfectDays: 1, dimensionCounts: {} },
    ['first_light']
  );

  assert.deepEqual(unlocked.map((item) => item.id), ['perfect_day']);
});

test('getUnlockedAchievements unlocks streak, dimension, and starlight achievements', () => {
  const unlocked = getUnlockedAchievements(
    { totalStarlight: 520, currentStreak: 7 },
    {
      totalCheckins: 24,
      perfectDays: 0,
      dimensionCounts: {
        study: 10,
        sport: 10,
        sleep: 10
      }
    },
    []
  );

  assert.deepEqual(unlocked.map((item) => item.id).sort(), [
    'first_light',
    'regular_sleep',
    'seven_day_route',
    'sport_orbit',
    'starlight_collector',
    'study_star'
  ]);
});
