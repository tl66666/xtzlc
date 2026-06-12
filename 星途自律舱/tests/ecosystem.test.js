const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEcosystemState, getNewUnlocks, getNextUnlock } = require('../utils/ecosystem');

test('getNewUnlocks returns parts crossed by a new checkin', () => {
  const unlocks = getNewUnlocks('sport', 0, 1);
  assert.equal(unlocks.length, 1);
  assert.equal(unlocks[0].name, '起点跑道');
});

test('buildEcosystemState summarizes unlocked parts per dimension', () => {
  const state = buildEcosystemState([
    { dimension: 'study' },
    { dimension: 'study' },
    { dimension: 'study' }
  ]);
  const study = state.find((item) => item.id === 'study');
  assert.equal(study.count, 3);
  assert.equal(study.unlockedCount, 2);
  assert.equal(getNextUnlock('study', 3).name, '图书馆侧楼');
});
