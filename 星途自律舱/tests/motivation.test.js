const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMotivation, getMissingDimensions } = require('../utils/motivation');
const { getGoalPreset } = require('../utils/goals');

test('getMissingDimensions excludes completed dimensions in order', () => {
  const missing = getMissingDimensions(['sport', 'study']).map((item) => item.id);
  assert.deepEqual(missing, ['diet', 'work', 'plan', 'sleep']);
});

test('buildMotivation returns next action and quest progress', () => {
  const goal = getGoalPreset('exam_boost');
  const motivation = buildMotivation(goal, ['study']);
  assert.equal(motivation.ringDegrees, 60);
  assert.equal(motivation.perfectDay, false);
  assert.equal(motivation.nextAction.dimension.id, 'plan');
  assert.equal(motivation.todayQuests.length, 3);
  assert.equal(motivation.questDoneCount >= 1, true);
});
