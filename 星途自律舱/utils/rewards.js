const { LEVELS } = require('./constants');

function calculateCheckinReward(input = {}) {
  const payload = input.payload || {};
  const effortBonusMap = {
    轻量: 0,
    标准: 4,
    深度: 10
  };
  const noteBonus = payload.note && String(payload.note).trim().length >= 6 ? 2 : 0;
  return 10 + (effortBonusMap[payload.effort] || 0) + noteBonus;
}

function calculateDailyReward({ completedCount, currentStreak }) {
  let reward = 0;
  if (completedCount >= 6) {
    reward += 30;
  }
  if (currentStreak > 0 && currentStreak % 7 === 0) {
    reward += 80;
  }
  return reward;
}

function getLevelInfo(totalStarlight) {
  const current = LEVELS.reduce((matched, item) => (
    totalStarlight >= item.threshold ? item : matched
  ), LEVELS[0]);
  const next = LEVELS.find((item) => item.threshold > totalStarlight) || null;
  const progress = next
    ? Math.round(((totalStarlight - current.threshold) / (next.threshold - current.threshold)) * 100)
    : 100;

  return {
    level: current.level,
    name: current.name,
    threshold: current.threshold,
    nextLevel: next ? next.level : current.level,
    nextName: next ? next.name : current.name,
    nextThreshold: next ? next.threshold : current.threshold,
    progress
  };
}

module.exports = {
  calculateCheckinReward,
  calculateDailyReward,
  getLevelInfo
};
