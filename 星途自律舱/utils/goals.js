const { GOAL_PRESETS, CHECKIN_TEMPLATES } = require('./constants');

function getGoalPreset(goalId) {
  return GOAL_PRESETS.find((goal) => goal.id === goalId) || GOAL_PRESETS[0];
}

function getRecommendedTemplates(goalId) {
  const goal = getGoalPreset(goalId);
  const selected = [];
  goal.focusDimensions.forEach((dimension) => {
    const firstForDimension = CHECKIN_TEMPLATES.find((template) => template.dimension === dimension);
    if (firstForDimension) selected.push(firstForDimension);
  });
  const selectedIds = new Set(selected.map((template) => template.id));
  const rest = CHECKIN_TEMPLATES.filter((template) => !selectedIds.has(template.id));
  return [...selected, ...rest];
}

function buildGoalProgress(goalId, completedDimensions = []) {
  const goal = getGoalPreset(goalId);
  const completed = new Set(completedDimensions);
  const total = goal.focusDimensions.length;
  const count = goal.focusDimensions.filter((dimension) => completed.has(dimension)).length;
  return {
    goal,
    total,
    completed: count,
    percent: total ? Math.round((count / total) * 100) : 0
  };
}

module.exports = {
  getGoalPreset,
  getRecommendedTemplates,
  buildGoalProgress
};
