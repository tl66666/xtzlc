const { ACHIEVEMENTS } = require('./constants');

function findAchievement(id) {
  return ACHIEVEMENTS.find((item) => item.id === id);
}

function getUnlockedAchievements(profile, stats, existingIds = []) {
  const existing = new Set(existingIds);
  const unlocked = [];

  function unlockWhen(condition, id) {
    if (condition && !existing.has(id)) {
      unlocked.push(findAchievement(id));
    }
  }

  unlockWhen(stats.totalCheckins > 0, 'first_light');
  unlockWhen(stats.perfectDays > 0, 'perfect_day');
  unlockWhen(profile.currentStreak >= 7, 'seven_day_route');
  unlockWhen((stats.dimensionCounts.study || 0) >= 10, 'study_star');
  unlockWhen((stats.dimensionCounts.sport || 0) >= 10, 'sport_orbit');
  unlockWhen((stats.dimensionCounts.sleep || 0) >= 10, 'regular_sleep');
  unlockWhen(profile.totalStarlight >= 500, 'starlight_collector');

  return unlocked.filter(Boolean);
}

module.exports = {
  getUnlockedAchievements
};
