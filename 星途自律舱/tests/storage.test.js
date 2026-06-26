const test = require('node:test');
const assert = require('node:assert/strict');

function loadStorageWithMockWx() {
  const cache = new Map();
  global.wx = {
    getStorageSync(key) {
      return cache.has(key) ? cache.get(key) : '';
    },
    setStorageSync(key, value) {
      cache.set(key, value);
    },
    removeStorageSync(key) {
      cache.delete(key);
    },
    getStorageInfoSync() {
      return {
        keys: Array.from(cache.keys())
      };
    }
  };

  delete require.cache[require.resolve('../utils/storage')];
  delete require.cache[require.resolve('../utils/cloudSync')];
  const storage = require('../utils/storage');
  return { storage, cache };
}

test('custom plans can be created, updated, completed, and deleted with persisted storage', () => {
  const { storage } = loadStorageWithMockWx();

  const created = storage.saveCustomPlan({
    title: 'Read algorithms',
    dimension: 'study',
    reminderTime: '20:30',
    payload: {
      customAction: 'Read algorithms',
      metric: '45 min'
    }
  });

  assert.equal(storage.listCustomPlans().length, 1);
  assert.equal(storage.listCustomPlans()[0].title, 'Read algorithms');

  const updated = storage.saveCustomPlan({
    ...created,
    title: 'Read DP notes',
    reminderTime: '21:00',
    payload: {
      customAction: 'Read DP notes',
      metric: '60 min'
    }
  });

  assert.equal(updated.id, created.id);
  assert.equal(storage.listCustomPlans().length, 1);
  assert.equal(storage.listCustomPlans()[0].title, 'Read DP notes');
  assert.equal(storage.listCustomPlans()[0].reminderTime, '21:00');

  storage.markPlanCompletion(created.id, '2026-06-26', {
    checkinId: '2026-06-26-study'
  });
  assert.equal(storage.getPlanLogMap('2026-06-26')[created.id].done, true);

  storage.deleteCustomPlan(created.id);
  assert.deepEqual(storage.listCustomPlans(), []);
  assert.deepEqual(storage.listPlanLogs(), []);
  assert.deepEqual(storage.getPlanLogMap('2026-06-26'), {});
});

test('resetLocalData removes profile, checkins, plans, plan logs, onboarding, and pending action state', () => {
  const { storage, cache } = loadStorageWithMockWx();

  storage.saveProfile({
    ...storage.getProfile(),
    nickname: 'Tester',
    totalStarlight: 120
  });
  const plan = storage.saveCustomPlan({
    title: 'Morning run',
    dimension: 'sport',
    payload: {
      customAction: 'Morning run',
      metric: '30 min'
    }
  });
  storage.markPlanCompletion(plan.id, '2026-06-26');
  storage.submitCheckin({
    dimension: 'sport',
    date: '2026-06-26',
    payload: {
      customAction: 'Morning run',
      metric: '30 min',
      note: 'finished'
    }
  });
  storage.saveOnboardingSeen();
  cache.set('star_cabin_pending_action', {
    dimension: 'sport',
    payload: { planId: plan.id }
  });
  cache.set('star_cabin_future_cache', {
    shouldBeRemoved: true
  });
  cache.set('other_app_cache', {
    shouldStay: true
  });

  assert.equal(storage.listCustomPlans().length, 1);
  assert.equal(storage.listCheckins().length, 1);
  assert.equal(storage.getOnboardingSeen(), true);
  assert.equal(cache.has('star_cabin_pending_action'), true);
  assert.equal(cache.has('star_cabin_future_cache'), true);

  storage.resetLocalData();

  assert.deepEqual(storage.listCustomPlans(), []);
  assert.deepEqual(storage.listPlanLogs(), []);
  assert.deepEqual(storage.listCheckins(), []);
  assert.deepEqual(storage.listAchievements(), []);
  assert.equal(storage.getOnboardingSeen(), false);
  assert.equal(storage.getProfile().nickname, '星途旅人');
  assert.equal(storage.getProfile().totalStarlight, 0);
  assert.equal(cache.has('star_cabin_pending_action'), false);
  assert.equal(cache.has('star_cabin_future_cache'), false);
  assert.equal(cache.has('other_app_cache'), true);
});
