const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getGoalPreset,
  getRecommendedTemplates,
  buildGoalProgress
} = require('../utils/goals');

test('getGoalPreset returns a named goal with focus dimensions', () => {
  const goal = getGoalPreset('exam_boost');
  assert.equal(goal.name, '学习提升');
  assert.deepEqual(goal.focusDimensions, ['study', 'plan', 'sleep']);
});

test('getRecommendedTemplates prioritizes goal focus dimensions', () => {
  const templates = getRecommendedTemplates('fitness_shape');
  assert.deepEqual(templates.slice(0, 2).map((item) => item.dimension), ['sport', 'diet']);
});

test('buildGoalProgress calculates completed focus dimensions for today', () => {
  const progress = buildGoalProgress('balanced_life', ['sport', 'study', 'sleep']);
  assert.equal(progress.total, 6);
  assert.equal(progress.completed, 3);
  assert.equal(progress.percent, 50);
});
